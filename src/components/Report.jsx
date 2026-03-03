import React, { useRef, useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

const MetricRow = ({ label, measured, expected, score }) => (
    <div className="metric-row">
        <h3>{label}</h3>
        <div className="metric-details">
            <div className="metric-col">
                <span className="metric-value-label">Measured:</span>
                <span className="metric-value">{measured.toFixed(2)}</span>
            </div>
            {expected && (
                <div className="metric-col">
                    <span className="metric-value-label">Expected:</span>
                    <span className="metric-value">{expected}</span>
                </div>
            )}
            <div className="metric-col metric-score">
                <span className="metric-value-label">Closeness:</span>
                <span className="metric-value">{Math.round(score)}%</span>
            </div>
        </div>
    </div>
);

const Report = ({ analysis }) => {
    const reportRef = useRef(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const count = useMotionValue(0);
    const rounded = useTransform(count, Math.round);

    useEffect(() => {
        if (analysis) {
            const controls = animate(count, analysis.finalScore, {
                duration: 2,
                ease: "easeOut"
            });
            return controls.stop;
        }
    }, [analysis]);

    if (!analysis) return null;

    const { finalScore, ratios, scores } = analysis;

    const handleDownload = async () => {
        if (!reportRef.current) return;
        setIsDownloading(true);

        try {
            // Use scale 1 to prevent massive canvas crashes, and save as JPEG to avoid PNG alpha channel corruption in PDF readers
            const canvas = await html2canvas(reportRef.current, {
                scale: 1,
                useCORS: true,
                backgroundColor: '#0A0A0A',
                logging: false
            });

            // JPEG is much safer for jsPDF than PNG
            const imgData = canvas.toDataURL('image/jpeg', 1.0);

            // Generate a standard A4 PDF (210x297mm)
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            const imgProps = pdf.getImageProperties(imgData);

            // Calculate scale to fit A4 width exactly, and add margin
            const margin = 15; // 15mm margin
            const renderWidth = pdfWidth - (margin * 2);
            const renderHeight = (imgProps.height * renderWidth) / imgProps.width;

            pdf.addImage(imgData, 'JPEG', margin, margin, renderWidth, renderHeight);

            // Output the PDF strictly as an array buffer to guarantee correct encoding
            const pdfArrayBuffer = pdf.output('arraybuffer');

            // Create a strict application/pdf Blob
            const pdfBlob = new Blob([pdfArrayBuffer], { type: 'application/pdf' });
            const blobUrl = URL.createObjectURL(pdfBlob);

            // Construct secure download anchor
            const link = document.createElement('a');
            link.href = blobUrl;
            link.setAttribute('download', 'Golden_Ratio_Report.pdf');
            link.style.display = 'none';
            document.body.appendChild(link);

            // Trigger
            link.click();

            // Cleanup
            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(blobUrl);
            }, 100);
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Failed to download the report. Please try again.");
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <motion.div
            className="report-container"
            ref={reportRef}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
        >
            <div className="report-header">
                <h2>📐 GOLDEN RATIO ANALYSIS REPORT</h2>
                <div className="overall-score-container">
                    <div className="score-circle-wrapper">
                        <svg width="180" height="180" viewBox="0 0 180 180">
                            <circle className="score-circle-bg" cx="90" cy="90" r="80" />
                            <motion.circle
                                className="score-circle-progress"
                                cx="90"
                                cy="90"
                                r="80"
                                strokeDasharray="502" // 2 * pi * 80
                                initial={{ strokeDashoffset: 502 }}
                                animate={{ strokeDashoffset: 502 - (502 * finalScore) / 100 }}
                                transition={{ duration: 2, ease: "easeOut" }}
                            />
                        </svg>
                        <div className="score-value">
                            <motion.h1>{rounded}</motion.h1><span>%</span>
                        </div>
                    </div>
                    <span className="overall-label">Overall Harmony</span>
                </div>
            </div>

            <div className="report-metrics">
                <MetricRow
                    label="Face Length to Width Ratio"
                    measured={ratios.faceProportion}
                    expected="1.618"
                    score={scores.faceProportion}
                />

                <div className="metric-row">
                    <h3>Vertical Facial Thirds</h3>
                    <p className="thirds-desc">Upper / Mid / Lower balance analysis</p>
                    <div className="metric-score">
                        <span className="metric-value-label">Score:</span>
                        <span className="metric-value">{Math.round(scores.verticalThirds)}%</span>
                    </div>
                </div>

                <MetricRow
                    label="Eye Spacing Ratio"
                    measured={ratios.eyeSpacing}
                    score={scores.eyeSpacing}
                />

                <MetricRow
                    label="Nose Proportion"
                    measured={ratios.noseProportion}
                    score={scores.noseProportion}
                />

                <MetricRow
                    label="Mouth Proportion"
                    measured={ratios.mouthToNose}
                    score={scores.mouthToNose}
                />
            </div>

            <div className="report-footer">
                <div className="summary-interpretation">
                    <h4>📊 Summary Interpretation:</h4>
                    <p>This report assesses proportional alignment and ratio harmony based on the mathematical constant phi (1.618). The overall score reflects the mathematical closeness of these primary facial features to established geometric proportions. Values indicate objective mathematical symmetry and structural arrangement without conveying subjective beauty assessments.</p>
                </div>
            </div>

            <div className="download-section">
                <button
                    className="download-btn"
                    onClick={handleDownload}
                    disabled={isDownloading}
                >
                    {isDownloading ? 'GENERATING PDF...' : '⬇ DOWNLOAD REPORT AS PDF'}
                </button>
            </div>
        </motion.div>
    );
};

export default Report;
