import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AdminContext } from '../../context/AdminContext';
import { FaDownload, FaFilePdf, FaPaperPlane } from 'react-icons/fa';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const CSReports = () => {
    const { atoken, backendurl } = useContext(AdminContext);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchReports = async () => {
        try {
            const { data } = await axios.get(`${backendurl}/api/cs-admin/reports`, { headers: { atoken } });
            if (data.success) {
                setReports(data.reports);
            } else toast.error(data.message);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, [atoken]);

    const handleDownload = (report) => {
        // Create an invisible anchor to download a JSON file of the report data
        const blob = new Blob([JSON.stringify(report.reportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `CS_Report_${report.employeeName || 'unknown'}_${new Date(report.generatedAt).toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleDownloadPDF = (report) => {
        const doc = new jsPDF();
        const { reportData, employeeName, period, periodLabel } = report;

        // Header
        doc.setFontSize(20);
        doc.setTextColor(14, 165, 233); // Emerald/Blue theme
        doc.text("PawVaidya CS Performance Report", 14, 22);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`${periodLabel} (${period.toUpperCase()})`, 14, 30);
        doc.text(`Generated on: ${new Date(report.generatedAt).toLocaleString()}`, 14, 35);

        // Employee Info
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text(`Employee Name: ${employeeName}`, 14, 45);
        doc.text(`Employee Email: ${report.employeeEmail}`, 14, 51);

        // Table Data
        const tableData = [
            ["Metric", "Value"],
            ["Total Tickets Handled", reportData.totalTicketsHandled.toString()],
            ["Tickets Resolved/Closed", reportData.ticketsResolved.toString()],
            ["Average Rating", `${reportData.averageRating?.toFixed(2) || '0.00'} Stars`],
            ["Total Ratings Received", reportData.totalRatings.toString()],
            ["Login Days in Period", reportData.loginDays.toString()],
            ["Calls Scheduled", reportData.callsScheduled.toString()]
        ];

        autoTable(doc, {
            startY: 60,
            head: [["Performance Metric", "Summary"]],
            body: tableData.slice(1),
            theme: 'striped',
            headStyles: { fillColor: [14, 165, 233] },
            styles: { fontSize: 10 }
        });

        // Rewards Section
        if (reportData.rewards && reportData.rewards.length > 0) {
            doc.setFontSize(14);
            doc.text("Rewards & Incentives", 14, doc.lastAutoTable.finalY + 15);
            const rewardData = reportData.rewards.map(r => [r.rewardType || 'Bonus', `₹${r.value}`, r.message]);
            autoTable(doc, {
                startY: doc.lastAutoTable.finalY + 20,
                head: [["Type", "Value", "Message"]],
                body: rewardData,
                theme: 'grid',
                headStyles: { fillColor: [168, 85, 247] } // Purple for rewards
            });
        }

        doc.save(`CS_Report_${employeeName.replace(/\s+/g, '_')}_${new Date(report.generatedAt).toISOString().split('T')[0]}.pdf`);
    };

    const handleResendEmail = async (reportId) => {
        try {
            const { data } = await axios.post(`${backendurl}/api/cs-admin/resend-report/${reportId}`, {}, { headers: { atoken } });
            if (data.success) {
                toast.success(data.message);
                fetchReports(); // Refresh to update email status
            } else toast.error(data.message);
        } catch (error) {
            toast.error(error.message);
        }
    };

    if (loading) return <div className="p-8">Loading reports...</div>;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Automated CS Reports</h1>
            <p className="text-sm text-gray-500 mb-6">Archive of all performance reports sent to Customer Service employees.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reports.map((report) => (
                    <div key={report._id} className="bg-white rounded-xl shadow-sm border border-emerald-100/50 p-5 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4 border-b border-gray-100 pb-3">
                            <div>
                                <h3 className="font-bold text-gray-800 truncate w-48">{report.employeeName || report.employeeId?.name || 'Unknown Agent'}</h3>
                                <p className="text-xs text-gray-500 capitalize leading-tight">{report.period} Report</p>
                            </div>
                            <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md font-mono">{new Date(report.generatedAt).toLocaleDateString()}</span>
                        </div>

                        <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Tickets Resolved</span>
                                <span className="font-bold text-gray-800">{report.reportData.ticketsResolved}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Average Rating</span>
                                <span className="font-bold text-yellow-500">⭐ {report.reportData.averageRating?.toFixed(1) || '0.0'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Login Days</span>
                                <span className="font-bold text-gray-800">{report.reportData.loginDays}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Email Status</span>
                                <span className={report.emailSent ? 'text-green-600' : 'text-red-500'}>
                                    {report.emailSent ? 'Sent' : 'Failed'}
                                </span>
                            </div>
                        </div>

                        <div className="flex space-x-2 mt-4">
                            <button
                                onClick={() => handleDownloadPDF(report)}
                                className="flex-1 flex items-center justify-center py-2 text-sm text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors font-semibold shadow-sm"
                            >
                                <FaFilePdf className="mr-2" /> Download PDF
                            </button>
                            <button
                                onClick={() => handleResendEmail(report._id)}
                                title="Share via Email"
                                className="p-2 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                            >
                                <FaPaperPlane size={14} />
                            </button>
                            <button
                                onClick={() => handleDownload(report)}
                                title="Download JSON Data"
                                className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <FaDownload size={14} />
                            </button>
                        </div>
                    </div>
                ))}
                {reports.length === 0 && (
                    <div className="col-span-full p-12 text-center text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
                        No reports generated yet. Reports are generated automatically by the scheduler.
                    </div>
                )}
            </div>
        </div>
    );
};

export default CSReports;
