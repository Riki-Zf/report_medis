import { useState, useEffect, useRef } from "react";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Legend, Tooltip } from "chart.js";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Legend, Tooltip);

export default function App() {
  const [patientId, setPatientId] = useState("");
  const [patientName, setPatientName] = useState("");
  const [department, setDepartment] = useState("");
  const [sistolik, setSistolik] = useState("");
  const [diastolik, setDiastolik] = useState("");
  const [records, setRecords] = useState([]);
  const chartRef = useRef(null);

  // LOAD DATA DARI LOCAL STORAGE SAAT AWAL
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("records")) || [];
    setRecords(saved);
  }, []);

  // SIMPAN SETIAP KALI RECORDS BERUBAH
  useEffect(() => {
    localStorage.setItem("records", JSON.stringify(records));
  }, [records]);

  const getColor = (sys, dia) => {
    if (sys < 120 && dia < 80) return "bg-green-200";
    if ((sys >= 120 && sys <= 139) || (dia >= 80 && dia <= 89)) return "bg-yellow-200";
    if ((sys >= 140 && sys <= 159) || (dia >= 90 && dia <= 99)) return "bg-orange-300";
    return "bg-red-300";
  };

  const getBloodPressureStatus = (sys, dia) => {
    if (sys < 120 && dia < 80) return "Normal";
    if ((sys >= 120 && sys <= 139) || (dia >= 80 && dia <= 89)) return "Prehipertensi";
    if ((sys >= 140 && sys <= 159) || (dia >= 90 && dia <= 99)) return "Hipertensi Tahap 1";
    return "Hipertensi Tahap 2";
  };

  const handleSubmit = () => {
    if (!patientId || !patientName || !department || !sistolik || !diastolik) {
      alert("Semua field harus diisi!");
      return;
    }

    const newRecord = {
      id: patientId,
      name: patientName,
      dept: department,
      systolic: Number(sistolik),
      diastolic: Number(diastolik),
      time: new Date().toLocaleTimeString(),
      color: getColor(Number(sistolik), Number(diastolik)),
    };

    setRecords([...records, newRecord]);

    setPatientId("");
    setPatientName("");
    setDepartment("");
    setSistolik("");
    setDiastolik("");
  };

  const exportToPDF = () => {
    const doc = new jsPDF();

    // Judul
    doc.setFontSize(18);
    doc.text("Laporan Tekanan Darah Pasien", 14, 20);

    // Tanggal cetak
    doc.setFontSize(10);
    doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString("id-ID")}`, 14, 28);

    // Tabel data pasien
    const tableData = records.map((r) => [r.id, r.name, r.dept, r.systolic, r.diastolic, r.time, getBloodPressureStatus(r.systolic, r.diastolic)]);

    autoTable(doc, {
      head: [["ID", "Nama", "Departemen", "Sistolik", "Diastolik", "Waktu", "Status"]],
      body: tableData,
      startY: 35,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [59, 130, 246] },
      didDrawCell: (data) => {
        if (data.section === "body" && data.column.index === 6) {
          const status = data.cell.raw;
          if (status === "Normal") {
            data.cell.styles.fillColor = [187, 247, 208];
          } else if (status === "Prehipertensi") {
            data.cell.styles.fillColor = [254, 240, 138];
          } else if (status === "Hipertensi Tahap 1") {
            data.cell.styles.fillColor = [253, 186, 116];
          } else if (status === "Hipertensi Tahap 2") {
            data.cell.styles.fillColor = [252, 165, 165];
          }
        }
      },
    });

    // Tambahkan grafik
    if (records.length > 0 && chartRef.current) {
      const chartImage = chartRef.current.toBase64Image();
      doc.addPage();
      doc.setFontSize(14);
      doc.text("Grafik Tekanan Darah", 14, 20);
      doc.addImage(chartImage, "PNG", 14, 30, 180, 100);
    }

    // Simpan PDF
    doc.save(`laporan-tekanan-darah-${new Date().toLocaleDateString("id-ID")}.pdf`);
  };

  // Data grafik tetap berdasarkan tekanan darah
  const chartData = {
    labels: records.map((r) => r.time),
    datasets: [
      {
        label: "Sistolik",
        data: records.map((r) => r.systolic),
        borderWidth: 2,
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.4)",
        tension: 0.3,
        pointRadius: 5,
      },
      {
        label: "Diastolik",
        data: records.map((r) => r.diastolic),
        borderWidth: 2,
        borderColor: "rgb(239, 68, 68)",
        backgroundColor: "rgba(239, 68, 68, 0.4)",
        tension: 0.3,
        pointRadius: 5,
      },
    ],
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
        <h1 className="text-2xl sm:text-3xl font-bold">Laporan Tekanan Darah Pasien</h1>
        <button
          onClick={exportToPDF}
          disabled={records.length === 0}
          className="bg-green-600 text-white px-3 sm:px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 text-sm sm:text-base w-full sm:w-auto justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
          Ekspor PDF
        </button>
      </div>

      {/* FORM */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 bg-gray-100 p-3 sm:p-4 rounded-lg">
        <div>
          <label className="block font-medium text-sm sm:text-base mb-1">ID Pasien</label>
          <input type="text" className="border p-2 w-full rounded text-sm sm:text-base" value={patientId} onChange={(e) => setPatientId(e.target.value)} />
        </div>

        <div>
          <label className="block font-medium text-sm sm:text-base mb-1">Nama Pasien</label>
          <input type="text" className="border p-2 w-full rounded text-sm sm:text-base" value={patientName} onChange={(e) => setPatientName(e.target.value)} />
        </div>

        <div>
          <label className="block font-medium text-sm sm:text-base mb-1">Departemen</label>
          <input type="text" className="border p-2 w-full rounded text-sm sm:text-base" value={department} onChange={(e) => setDepartment(e.target.value)} />
        </div>

        <div>
          <label className="block font-medium text-sm sm:text-base mb-1">Sistolik</label>
          <input type="number" className="border p-2 w-full rounded text-sm sm:text-base" value={sistolik} onChange={(e) => setSistolik(e.target.value)} />
        </div>

        <div>
          <label className="block font-medium text-sm sm:text-base mb-1">Diastolik</label>
          <input type="number" className="border p-2 w-full rounded text-sm sm:text-base" value={diastolik} onChange={(e) => setDiastolik(e.target.value)} />
        </div>

        <button onClick={handleSubmit} className="bg-blue-600 text-white px-4 py-2 rounded col-span-1 sm:col-span-2 hover:bg-blue-700 text-sm sm:text-base">
          Tambah Laporan
        </button>
      </div>

      {/* TABEL */}
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden border border-gray-300 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead>
                <tr className="bg-gray-300">
                  <th className="border p-2 text-xs sm:text-sm">ID</th>
                  <th className="border p-2 text-xs sm:text-sm">Nama</th>
                  <th className="border p-2 text-xs sm:text-sm hidden sm:table-cell">Departemen</th>
                  <th className="border p-2 text-xs sm:text-sm">Sistolik</th>
                  <th className="border p-2 text-xs sm:text-sm">Diastolik</th>
                  <th className="border p-2 text-xs sm:text-sm hidden md:table-cell">Waktu</th>
                </tr>
              </thead>

              <tbody>
                {records.map((r, i) => (
                  <tr key={i} className={r.color}>
                    <td className="border p-2 text-xs sm:text-sm">{r.id}</td>
                    <td className="border p-2 text-xs sm:text-sm">{r.name}</td>
                    <td className="border p-2 text-xs sm:text-sm hidden sm:table-cell">{r.dept}</td>
                    <td className="border p-2 text-xs sm:text-sm">{r.systolic}</td>
                    <td className="border p-2 text-xs sm:text-sm">{r.diastolic}</td>
                    <td className="border p-2 text-xs sm:text-sm hidden md:table-cell">{r.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* GRAFIK */}
      <div className="bg-white p-3 sm:p-4 rounded shadow">
        <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Grafik Tekanan Darah</h2>
        <div className="w-full h-64 sm:h-80 md:h-96">
          <Line ref={chartRef} data={chartData} options={{ maintainAspectRatio: false, responsive: true }} />
        </div>
      </div>
    </div>
  );
}
