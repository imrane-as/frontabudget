# PDF unlocking runtime

`qpdf.js` and `qpdf.wasm` are generated during dependency installation and
before production builds. They come from
[`@neslinesli93/qpdf-wasm`](https://github.com/neslinesli93/qpdf-wasm),
version 0.3.0 (ISC), itself built from [QPDF](https://github.com/qpdf/qpdf).

They are served locally so payslip files and passwords are not sent to a
third-party PDF service.
