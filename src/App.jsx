import React, { useState, useRef, useEffect } from 'react';
import Report from './components/Report';
import { initializeFaceLandmarker, analyzeFace } from './utils/faceAnalysis';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

// Configure the correct worker path for pdfjs
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

function App() {
    const [imageSrc, setImageSrc] = useState(null);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const imageRef = useRef(null);

    useEffect(() => {
        // Pre-load MediaPipe on mount
        initializeFaceLandmarker().catch(err => {
            console.error("Failed to initialize FaceLandmarker:", err);
            setErrorMsg("Failed to load required analysis models. Please refresh the page.");
        });
    }, []);

    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Reset state
        setAnalysisResult(null);
        setErrorMsg('');

        const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

        if (isPdf) {
            setLoading(true);
            try {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

                // Get the first page of the PDF
                const page = await pdf.getPage(1);

                // Scale for better image resolution
                const viewport = page.getViewport({ scale: 2.0 });

                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                await page.render({
                    canvasContext: context,
                    viewport: viewport
                }).promise;

                const dataUrl = canvas.toDataURL('image/jpeg');
                setImageSrc(dataUrl);
            } catch (err) {
                console.error("PDF Parsing Error:", err);
                setErrorMsg("Failed to process the PDF. Please ensure it is a valid file.");
            } finally {
                setLoading(false);
            }
        } else {
            setImageSrc(URL.createObjectURL(file));
        }
    };

    const handleImageLoad = async () => {
        if (!imageRef.current) return;

        setLoading(true);
        try {
            const faceLandmarker = await initializeFaceLandmarker();
            const results = faceLandmarker.detect(imageRef.current);

            if (!results.faceLandmarks || results.faceLandmarks.length === 0) {
                setErrorMsg("No face detected. Please provide a clearer, single-face frontal image.");
                setAnalysisResult(null);
            } else if (results.faceLandmarks.length > 1) {
                setErrorMsg("Multiple faces detected. Please provide an image with only one face.");
                setAnalysisResult(null);
            } else {
                const analysis = analyzeFace(results.faceLandmarks);
                setAnalysisResult(analysis);
            }
        } catch (err) {
            console.error(err);
            setErrorMsg("An error occurred during analysis. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="app-container">
            <header className="app-header">
                <h1>Golden Ratio Engine</h1>
                <p>Mathematical Symmetry & Proportion Analysis</p>
            </header>

            <main className="app-main">
                <div className="upload-section">
                    <label htmlFor="file-upload" className="upload-btn">
                        Choose Portrait Image
                    </label>
                    <input
                        id="file-upload"
                        type="file"
                        accept=".pdf, image/jpeg, image/jpg, image/png"
                        onChange={handleImageUpload}
                        style={{ display: 'none' }}
                    />
                    <p className="upload-subtitle">For best results, upload a clear, front-facing portrait with neutral expression.</p>
                </div>

                <div className="prominent-disclaimer">
                    <h4><span className="icon">⚠️</span> Important Notice</h4>
                    <p>Please note that analysis precision can vary depending on photo lighting, camera perspective distortion, head tilt, or minor facial obstructions.</p>
                </div>

                {errorMsg && (
                    <div className="error-message">
                        {errorMsg}
                    </div>
                )}

                <div className="content-grid">
                    {imageSrc && (
                        <div className="image-preview-container">
                            <img
                                ref={imageRef}
                                src={imageSrc}
                                alt="Subject"
                                className="uploaded-image"
                                onLoad={handleImageLoad}
                                crossOrigin="anonymous"
                            />
                            {loading && (
                                <div className="loading-overlay">
                                    <div className="spinner"></div>
                                    <p>Processing geometric landmarks...</p>
                                </div>
                            )}
                        </div>
                    )}

                    {analysisResult && !loading && (
                        <div className="result-container">
                            <Report analysis={analysisResult} />
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default App;
