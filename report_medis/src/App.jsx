import { useState, useEffect, useRef } from "react";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Legend, Tooltip } from "chart.js";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Legend, Tooltip);

export default function App() {
  const [nama, setNama] = useState("");
  const [bn, setBn] = useState("");
  const [umur, setUmur] = useState("");
  const [jabatan, setJabatan] = useState("");
  const [supervisor, setSupervisor] = useState("");
  const [department, setDepartment] = useState("");
  const [sistolik, setSistolik] = useState("");
  const [diastolik, setDiastolik] = useState("");
  const [nadi, setNadi] = useState("");
  const [spo2, setSpo2] = useState("");
  const [suhu, setSuhu] = useState("");
  const [tanggal, setTanggal] = useState("");
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

  const getFitnessStatus = (sys, dia, nadi, spo2, suhu) => {
    // Cek tekanan darah
    const bpNormal = sys < 140 && dia < 90;

    // Cek nadi (normal: 60-100 bpm)
    const nadiNormal = nadi >= 60 && nadi <= 100;

    // Cek SpO2 (normal: >= 95%)
    const spo2Normal = spo2 >= 95;

    // Cek suhu (normal: 36-37.5°C)
    const suhuNormal = suhu >= 36 && suhu <= 37.5;

    // Jika semua parameter normal = FIT
    if (bpNormal && nadiNormal && spo2Normal && suhuNormal) {
      return "FIT";
    }

    return "TIDAK FIT";
  };

  const getFitnessColor = (status) => {
    return status === "FIT" ? "text-green-700 font-bold" : "text-red-700 font-bold";
  };

  const handleSubmit = () => {
    if (!nama || !bn || !umur || !jabatan || !supervisor || !department || !sistolik || !diastolik || !nadi || !spo2 || !suhu || !tanggal) {
      alert("Semua field harus diisi!");
      return;
    }

    const newRecord = {
      nama,
      bn,
      umur: Number(umur),
      jabatan,
      supervisor,
      dept: department,
      systolic: Number(sistolik),
      diastolic: Number(diastolik),
      nadi: Number(nadi),
      spo2: Number(spo2),
      suhu: Number(suhu),
      tanggal,
      time: new Date().toLocaleTimeString(),
      color: getColor(Number(sistolik), Number(diastolik)),
      fitness: getFitnessStatus(Number(sistolik), Number(diastolik), Number(nadi), Number(spo2), Number(suhu)),
    };

    setRecords([...records, newRecord]);

    setNama("");
    setBn("");
    setUmur("");
    setJabatan("");
    setSupervisor("");
    setDepartment("");
    setSistolik("");
    setDiastolik("");
    setNadi("");
    setSpo2("");
    setSuhu("");
    setTanggal("");
  };

  const handleDelete = (index) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus data ini?")) {
      const newRecords = records.filter((_, i) => i !== index);
      setRecords(newRecords);
    }
  };

  const handleDeleteAll = () => {
    if (window.confirm("Apakah Anda yakin ingin menghapus SEMUA data?")) {
      setRecords([]);
      localStorage.removeItem("records");
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF("landscape");

    // Judul
    doc.setFontSize(18);
    doc.text("Laporan Kesehatan Karyawan", 14, 20);

    // Tanggal cetak
    doc.setFontSize(10);
    doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString("id-ID")}`, 14, 28);

    // Tabel data
    const tableData = records.map((r) => [r.nama, r.bn, r.umur, r.jabatan, r.supervisor, r.dept, r.systolic, r.diastolic, r.nadi, r.spo2 + "%", r.suhu + "°C", r.tanggal, getBloodPressureStatus(r.systolic, r.diastolic), r.fitness]);

    autoTable(doc, {
      head: [["Nama", "BN", "Umur", "Jabatan", "Supervisor", "Dept", "Sistolik", "Diastolik", "Nadi", "SpO2", "Suhu", "Tanggal", "Status TD", "Status Fit"]],
      body: tableData,
      startY: 35,
      styles: { fontSize: 7 },
      headStyles: { fillColor: [59, 130, 246] },
      didDrawCell: (data) => {
        if (data.section === "body" && data.column.index === 12) {
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
        if (data.section === "body" && data.column.index === 13) {
          const status = data.cell.raw;
          if (status === "FIT") {
            data.cell.styles.fillColor = [187, 247, 208];
            data.cell.styles.fontStyle = "bold";
          } else {
            data.cell.styles.fillColor = [252, 165, 165];
            data.cell.styles.fontStyle = "bold";
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
      doc.addImage(chartImage, "PNG", 14, 30, 260, 100);
    }

    // Simpan PDF
    doc.save(`laporan-kesehatan-${new Date().toLocaleDateString("id-ID")}.pdf`);
  };

  // Data grafik tetap berdasarkan tekanan darah
  const chartData = {
    labels: records.map((r) => r.tanggal || r.time),
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
        <h1 className="text-2xl sm:text-3xl font-bold">Laporan Kesehatan Karyawan</h1>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={handleDeleteAll}
            disabled={records.length === 0}
            className="bg-red-600 text-white px-3 sm:px-4 py-2 rounded hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 text-sm sm:text-base flex-1 sm:flex-initial justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            Hapus Semua
          </button>
          <button
            onClick={exportToPDF}
            disabled={records.length === 0}
            className="bg-green-600 text-white px-3 sm:px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 text-sm sm:text-base flex-1 sm:flex-initial justify-center"
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
      </div>

      {/* FORM */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 bg-gray-100 p-3 sm:p-4 rounded-lg">
        <div>
          <label className="block font-medium text-sm sm:text-base mb-1">Nama</label>
          <input type="text" className="border p-2 w-full rounded text-sm sm:text-base" value={nama} onChange={(e) => setNama(e.target.value)} />
        </div>

        <div>
          <label className="block font-medium text-sm sm:text-base mb-1">BN</label>
          <input type="text" className="border p-2 w-full rounded text-sm sm:text-base" value={bn} onChange={(e) => setBn(e.target.value)} />
        </div>

        <div>
          <label className="block font-medium text-sm sm:text-base mb-1">Umur</label>
          <input type="number" className="border p-2 w-full rounded text-sm sm:text-base" value={umur} onChange={(e) => setUmur(e.target.value)} />
        </div>

        <div>
          <label className="block font-medium text-sm sm:text-base mb-1">Jabatan</label>
          <input type="text" className="border p-2 w-full rounded text-sm sm:text-base" value={jabatan} onChange={(e) => setJabatan(e.target.value)} />
        </div>

        <div>
          <label className="block font-medium text-sm sm:text-base mb-1">Supervisor</label>
          <input type="text" className="border p-2 w-full rounded text-sm sm:text-base" value={supervisor} onChange={(e) => setSupervisor(e.target.value)} />
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

        <div>
          <label className="block font-medium text-sm sm:text-base mb-1">Nadi</label>
          <input type="number" className="border p-2 w-full rounded text-sm sm:text-base" value={nadi} onChange={(e) => setNadi(e.target.value)} />
        </div>

        <div>
          <label className="block font-medium text-sm sm:text-base mb-1">Oksigen Darah (SpO2)</label>
          <input type="number" className="border p-2 w-full rounded text-sm sm:text-base" value={spo2} onChange={(e) => setSpo2(e.target.value)} />
        </div>

        <div>
          <label className="block font-medium text-sm sm:text-base mb-1">Suhu Badan (°C)</label>
          <input type="number" step="0.1" className="border p-2 w-full rounded text-sm sm:text-base" value={suhu} onChange={(e) => setSuhu(e.target.value)} />
        </div>

        <div>
          <label className="block font-medium text-sm sm:text-base mb-1">Tanggal</label>
          <input type="date" className="border p-2 w-full rounded text-sm sm:text-base" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
        </div>

        <button onClick={handleSubmit} className="bg-blue-600 text-white px-4 py-2 rounded col-span-1 sm:col-span-2 lg:col-span-3 hover:bg-blue-700 text-sm sm:text-base">
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
                  <th className="border p-2 text-xs sm:text-sm">Nama</th>
                  <th className="border p-2 text-xs sm:text-sm">BN</th>
                  <th className="border p-2 text-xs sm:text-sm hidden lg:table-cell">Umur</th>
                  <th className="border p-2 text-xs sm:text-sm hidden md:table-cell">Jabatan</th>
                  <th className="border p-2 text-xs sm:text-sm hidden xl:table-cell">Supervisor</th>
                  <th className="border p-2 text-xs sm:text-sm hidden lg:table-cell">Dept</th>
                  <th className="border p-2 text-xs sm:text-sm">Sistolik</th>
                  <th className="border p-2 text-xs sm:text-sm">Diastolik</th>
                  <th className="border p-2 text-xs sm:text-sm hidden md:table-cell">Nadi</th>
                  <th className="border p-2 text-xs sm:text-sm hidden lg:table-cell">SpO2</th>
                  <th className="border p-2 text-xs sm:text-sm hidden lg:table-cell">Suhu</th>
                  <th className="border p-2 text-xs sm:text-sm hidden xl:table-cell">Tanggal</th>
                  <th className="border p-2 text-xs sm:text-sm">Status Fit</th>
                  <th className="border p-2 text-xs sm:text-sm">Aksi</th>
                </tr>
              </thead>

              <tbody>
                {records.map((r, i) => (
                  <tr key={i} className={r.color}>
                    <td className="border p-2 text-xs sm:text-sm">{r.nama}</td>
                    <td className="border p-2 text-xs sm:text-sm">{r.bn}</td>
                    <td className="border p-2 text-xs sm:text-sm hidden lg:table-cell">{r.umur}</td>
                    <td className="border p-2 text-xs sm:text-sm hidden md:table-cell">{r.jabatan}</td>
                    <td className="border p-2 text-xs sm:text-sm hidden xl:table-cell">{r.supervisor}</td>
                    <td className="border p-2 text-xs sm:text-sm hidden lg:table-cell">{r.dept}</td>
                    <td className="border p-2 text-xs sm:text-sm">{r.systolic}</td>
                    <td className="border p-2 text-xs sm:text-sm">{r.diastolic}</td>
                    <td className="border p-2 text-xs sm:text-sm hidden md:table-cell">{r.nadi}</td>
                    <td className="border p-2 text-xs sm:text-sm hidden lg:table-cell">{r.spo2}%</td>
                    <td className="border p-2 text-xs sm:text-sm hidden lg:table-cell">{r.suhu}°C</td>
                    <td className="border p-2 text-xs sm:text-sm hidden xl:table-cell">{r.tanggal}</td>
                    <td className={`border p-2 text-xs sm:text-sm text-center ${getFitnessColor(r.fitness)}`}>{r.fitness}</td>
                    <td className="border p-2 text-center">
                      <button onClick={() => handleDelete(i)} className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs sm:text-sm inline-flex items-center gap-1" title="Hapus data">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path
                            fillRule="evenodd"
                            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="hidden sm:inline">Hapus</span>
                      </button>
                    </td>
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
