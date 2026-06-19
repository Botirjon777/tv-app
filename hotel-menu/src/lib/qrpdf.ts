"use client";

import jsPDF from "jspdf";
import QRCode from "qrcode";

type Room = { number: string; name?: string };

// Build a printable PDF with one QR card per room (3×3 grid per A4 page).
// Each card shows the hotel name, room number and the encoded URL.
export async function downloadRoomQrPdf(opts: {
  hotelName: string;
  rooms: Room[];
  urlFor: (roomNumber: string) => string;
  fileName?: string;
}) {
  const { hotelName, rooms, urlFor } = opts;
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const pageW = 210;
  const pageH = 297;
  const margin = 12;
  const headerH = 14;
  const cols = 3;
  const rows = 3;
  const perPage = cols * rows;

  const gridW = pageW - margin * 2;
  const gridH = pageH - margin * 2 - headerH;
  const cellW = gridW / cols;
  const cellH = gridH / rows;
  const qrSize = Math.min(cellW, cellH) - 22; // mm

  // Pre-render all QR codes to PNG data URLs.
  const images = await Promise.all(
    rooms.map((r) =>
      QRCode.toDataURL(urlFor(r.number), {
        width: 512,
        margin: 1,
        errorCorrectionLevel: "M",
      })
    )
  );

  rooms.forEach((room, i) => {
    const pageIndex = Math.floor(i / perPage);
    const posInPage = i % perPage;

    if (posInPage === 0) {
      if (pageIndex > 0) doc.addPage();
      // Page header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(hotelName, margin, margin + 6);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.text("Scan to view the in-room dining menu", margin, margin + 11);
      doc.setTextColor(0);
    }

    const col = posInPage % cols;
    const row = Math.floor(posInPage / cols);
    const cellX = margin + col * cellW;
    const cellY = margin + headerH + row * cellH;

    // Card border
    doc.setDrawColor(225);
    doc.roundedRect(cellX + 2, cellY + 2, cellW - 4, cellH - 4, 2, 2);

    // QR centered horizontally
    const qrX = cellX + (cellW - qrSize) / 2;
    const qrY = cellY + 8;
    doc.addImage(images[i], "PNG", qrX, qrY, qrSize, qrSize);

    // Room number
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(`Room ${room.number}`, cellX + cellW / 2, qrY + qrSize + 7, {
      align: "center",
    });

    // URL (small, muted)
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(150);
    doc.text(
      urlFor(room.number),
      cellX + cellW / 2,
      qrY + qrSize + 11,
      { align: "center", maxWidth: cellW - 8 }
    );
    doc.setTextColor(0);
  });

  const fileName =
    opts.fileName ??
    `${hotelName.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-room-qr-codes.pdf`;
  doc.save(fileName);
}
