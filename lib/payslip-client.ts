import {
  detectEmployerName,
  detectNetSalary,
  detectPayslipPeriod
} from "@/lib/payslip";

type QpdfFileSystem = {
  writeFile: (path: string, data: Uint8Array) => void;
  readFile: (path: string) => Uint8Array;
  unlink?: (path: string) => void;
};

type QpdfRuntime = {
  callMain: (args: string[]) => number;
  FS: QpdfFileSystem;
};

type QpdfFactory = (options: {
  locateFile: () => string;
  noInitialRun: boolean;
}) => Promise<QpdfRuntime>;

let qpdfFactoryPromise: Promise<QpdfFactory> | null = null;

function loadQpdfFactory() {
  if (qpdfFactoryPromise) return qpdfFactoryPromise;

  qpdfFactoryPromise = new Promise<QpdfFactory>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "/wasm/qpdf.js";
    script.async = true;
    script.dataset.frontabudgetQpdf = "true";
    script.onload = () => {
      const factory = (window as typeof window & { Module?: QpdfFactory }).Module;
      if (typeof factory === "function") resolve(factory);
      else reject(new Error("QPDF unavailable"));
    };
    script.onerror = () => reject(new Error("QPDF unavailable"));
    document.head.appendChild(script);
  });

  return qpdfFactoryPromise;
}

export type ProcessedPayslip = {
  blob: Blob;
  salary: number | null;
  period: { month: number; year: number } | null;
  pageCount: number;
  wasProtected: boolean;
  employerName: string | null;
};

async function validatePdf(file: File) {
  const header = new TextDecoder("ascii").decode(
    new Uint8Array(await file.slice(0, 5).arrayBuffer())
  );

  if (header !== "%PDF-") {
    throw new Error("Ce fichier ne semble pas être un PDF valide.");
  }
}

async function analyzePdfBytes(
  bytes: Uint8Array,
  blob: Blob,
  wasProtected: boolean
): Promise<ProcessedPayslip> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const document = await getDocumentProxy(new Uint8Array(bytes));

  try {
    const { text } = await extractText(document, { mergePages: true });

    return {
      blob,
      salary: detectNetSalary(text),
      period: detectPayslipPeriod(text),
      pageCount: document.numPages,
      wasProtected,
      employerName: detectEmployerName(text)
    };
  } finally {
    await (document as unknown as { cleanup: () => Promise<unknown> }).cleanup();
  }
}

export function isPdfPasswordRequired(error: unknown) {
  if (!error || typeof error !== "object") return false;

  const candidate = error as { name?: string; message?: string; code?: number };
  return (
    candidate.name === "PasswordException" ||
    candidate.code === 1 ||
    /password|mot de passe/i.test(candidate.message || "")
  );
}

export async function analyzePayslip(file: File): Promise<ProcessedPayslip> {
  await validatePdf(file);
  const bytes = new Uint8Array(await file.arrayBuffer());

  return analyzePdfBytes(bytes, file, false);
}

export async function unlockAndAnalyzePayslip(
  file: File,
  password: string
): Promise<ProcessedPayslip> {
  await validatePdf(file);

  let qpdf: QpdfRuntime;

  try {
    const createQpdf = await loadQpdfFactory();
    qpdf = await createQpdf({
      locateFile: () => "/wasm/qpdf.wasm",
      noInitialRun: true
    });
  } catch {
    throw new Error(
      "Le module d’ouverture sécurisée n’a pas pu démarrer. Actualise la page puis réessaie."
    );
  }
  const inputPath = "/payslip-input.pdf";
  const outputPath = "/payslip-unlocked.pdf";

  try {
    qpdf.FS.writeFile(inputPath, new Uint8Array(await file.arrayBuffer()));
    const exitCode = qpdf.callMain([
      `--password=${password}`,
      "--decrypt",
      inputPath,
      outputPath
    ]);

    if (exitCode !== 0) throw new Error("qpdf failed");

    const output = new Uint8Array(qpdf.FS.readFile(outputPath));
    const unlockedBytes = new Uint8Array(output);
    return analyzePdfBytes(
      unlockedBytes,
      new Blob([unlockedBytes.buffer], { type: "application/pdf" }),
      true
    );
  } catch {
    throw new Error(
      "Le PDF n’a pas pu être ouvert. Vérifie le mot de passe ou essaie un autre fichier."
    );
  } finally {
    qpdf.FS.unlink?.(inputPath);
    qpdf.FS.unlink?.(outputPath);
  }
}
