// src/components/ui/QrCodeDisplay.jsx
"use client";

import { useState } from "react";
import QRCode from "react-qr-code";
import { QrCode, Download, Copy, Eye, EyeOff, Maximize2 } from "lucide-react";
import toast from "react-hot-toast";

export default function QRCodeDisplay({ token, sessionInfo }) {
  const [showQR, setShowQR] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Create QR data with additional session info
  const qrData = JSON.stringify({
    token,
    type: "attendance",
    subject: sessionInfo?.subject,
    class: sessionInfo?.class,
    date: sessionInfo?.date,
  });

  const copyToken = async () => {
    try {
      await navigator.clipboard.writeText(token);
      toast.success("Token berhasil disalin!");
    } catch (error) {
      toast.error("Gagal menyalin token");
    }
  };

  const downloadQR = () => {
    const svg = document.getElementById("qr-code-svg");
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);

        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `qr-attendance-${token}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      };

      img.src = "data:image/svg+xml;base64," + btoa(svgData);
    }
  };

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900">QR Code Absensi</h3>
            <button
              onClick={() => setIsFullscreen(false)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ×
            </button>
          </div>

          <div className="bg-white p-6 rounded-xl border-2 border-blue-200 mb-6">
            <QRCode
              id="qr-code-svg"
              value={qrData}
              size={280}
              style={{ height: "auto", maxWidth: "100%", width: "100%" }}
              viewBox="0 0 256 256"
              fgColor="#0066cc"
              bgColor="#ffffff"
            />
          </div>

          <div className="text-center space-y-3">
            <p className="text-sm text-gray-600">
              Scan QR code ini untuk absensi
            </p>
            <div className="flex justify-center space-x-2">
              <button onClick={copyToken} className="btn-secondary">
                <Copy className="w-4 h-4" />
                <span className="ml-2">Salin Token</span>
              </button>
              <button onClick={downloadQR} className="btn-secondary">
                <Download className="w-4 h-4" />
                <span className="ml-2">Download</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200 shadow-blue">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
            <QrCode className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-blue-900">QR Code Absensi</h3>
            <p className="text-sm text-blue-600">Scan untuk bergabung</p>
          </div>
        </div>

        <button
          onClick={() => setShowQR(!showQR)}
          className={`px-4 py-2 rounded-lg font-medium transition-all inline-flex items-center ${
            showQR
              ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg"
              : "bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50"
          }`}
        >
          {showQR ? (
            <>
              <EyeOff className="w-4 h-4 mr-2" />
              Sembunyikan
            </>
          ) : (
            <>
              <Eye className="w-4 h-4 mr-2" />
              Tampilkan QR
            </>
          )}
        </button>
      </div>

      {showQR && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border-2 border-dashed border-blue-300 relative group flex justify-center">
            <QRCode
              id="qr-code-svg"
              value={qrData}
              size={160}
              style={{ height: "auto", maxWidth: "100%", width: "100%" }}
              viewBox="0 0 256 256"
              fgColor="#0066cc"
              bgColor="#ffffff"
            />

            {/* Overlay with actions */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100">
              <button
                onClick={() => setIsFullscreen(true)}
                className="bg-white text-gray-700 p-2 rounded-lg shadow-lg hover:bg-blue-50 transition-colors"
                title="Tampilkan fullscreen"
              >
                <Maximize2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span className="font-mono bg-blue-100 text-blue-700 px-3 py-1 rounded-lg font-medium">
                {token}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={copyToken}
                className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded-lg transition-colors"
                title="Salin token"
              >
                <Copy className="w-4 h-4" />
              </button>

              <button
                onClick={downloadQR}
                className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded-lg transition-colors"
                title="Download QR code"
              >
                <Download className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsFullscreen(true)}
                className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded-lg transition-colors"
                title="Tampilkan fullscreen"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="bg-blue-100 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow">
                <span className="text-white text-xs font-bold">i</span>
              </div>
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">Cara menggunakan:</p>
                <ul className="space-y-1 text-xs text-blue-700">
                  <li>• Siswa scan QR code dengan aplikasi absensi</li>
                  <li>
                    • Atau masukkan token secara manual:{" "}
                    <span className="font-mono bg-blue-200 px-1.5 py-0.5 rounded">
                      {token}
                    </span>
                  </li>
                  <li>• QR code akan otomatis expired sesuai jadwal</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
