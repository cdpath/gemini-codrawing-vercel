import { useState, useRef, useEffect } from "react";
import { SendHorizontal, LoaderCircle, Trash2 } from "lucide-react";
import Head from "next/head";

export default function Home() {
  const canvasRef = useRef(null);
  const backgroundImageRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState("#000000");
  const colorInputRef = useRef(null);
  const [prompt, setPrompt] = useState("");
  const [generatedImage, setGeneratedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load background image when generatedImage changes
  useEffect(() => {
    if (generatedImage && canvasRef.current) {
      // Use the window.Image constructor to avoid conflict with Next.js Image component
      const img = new window.Image();
      img.onload = () => {
        backgroundImageRef.current = img;
        drawImageToCanvas();
      };
      img.src = generatedImage;
    }
  }, [generatedImage]);

  // Initialize canvas with white background when component mounts
  useEffect(() => {
    if (canvasRef.current) {
      initializeCanvas();
    }
  }, []);

  // Initialize canvas with white background
  const initializeCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    
    // Fill canvas with white background
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  // Draw the background image to the canvas
  const drawImageToCanvas = () => {
    if (!canvasRef.current || !backgroundImageRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    
    // Fill with white background first
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw the background image
    ctx.drawImage(
      backgroundImageRef.current,
      0, 0,
      canvas.width, canvas.height
    );
  };

  // Get the correct coordinates based on canvas scaling
  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Calculate the scaling factor between the internal canvas size and displayed size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    // Apply the scaling to get accurate coordinates
    return {
      x: (e.nativeEvent.offsetX || (e.nativeEvent.touches?.[0]?.clientX - rect.left)) * scaleX,
      y: (e.nativeEvent.offsetY || (e.nativeEvent.touches?.[0]?.clientY - rect.top)) * scaleY
    };
  };

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const { x, y } = getCoordinates(e);
    
    // Start a new path without clearing the canvas
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const { x, y } = getCoordinates(e);
    
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.strokeStyle = penColor;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    
    // Fill with white instead of just clearing
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    setGeneratedImage(null);
    backgroundImageRef.current = null;
  };

  const handleColorChange = (e) => {
    setPenColor(e.target.value);
  };

  const openColorPicker = () => {
    if (colorInputRef.current) {
      colorInputRef.current.click();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      openColorPicker();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!canvasRef.current) return;
    
    setIsLoading(true);
    
    try {
      // Get the drawing as base64 data
      const canvas = canvasRef.current;
      
      // Create a temporary canvas to add white background
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      
      // Fill with white background
      tempCtx.fillStyle = '#FFFFFF';
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      
      // Draw the original canvas content on top of the white background
      tempCtx.drawImage(canvas, 0, 0);
      
      const drawingData = tempCanvas.toDataURL("image/png").split(",")[1];
      
      // Create request payload
      const requestPayload = {
        prompt,
        drawingData,
        saveToFile: true
      };
      
      // Log the request payload (without the full image data for brevity)
      console.log("Request payload:", {
        ...requestPayload,
        drawingData: drawingData ? `${drawingData.substring(0, 50)}... (truncated)` : null
      });
      
      // Send the drawing and prompt to the API
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestPayload),
      });
      
      const data = await response.json();
      
      // Log the response (without the full image data for brevity)
      console.log("Response:", {
        ...data,
        imageData: data.imageData ? `${data.imageData.substring(0, 50)}... (truncated)` : null
      });
      
      if (data.success && data.imageData) {
        const imageUrl = `data:image/png;base64,${data.imageData}`;
        setGeneratedImage(imageUrl);
      } else {
        console.error("Failed to generate image:", data.error);
        alert("Failed to generate image. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting drawing:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
  <>
  <Head>
    <title>Gemini Co-Drawing</title>
    <meta name="description" content="Gemini Co-Drawing" />
    <link rel="icon" href="/favicon.ico" />
  </Head>
  <div className="min-h-screen notebook-paper-bg text-gray-900 flex flex-col justify-start items-center">     
      
      <main className="container mx-auto px-3 sm:px-6 py-5 sm:py-10 max-w-5xl w-full">
        {/* Header section with title and tools */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-4 sm:mb-6 gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-0 leading-tight font-mega">Gemini Co-Drawing</h1>
            <p className="text-sm sm:text-base text-gray-500 mt-1">
            Built with{" "}
              <a className="underline" href="https://ai.google.dev/gemini-api/docs/image-generation" target="_blank" rel="noopener noreferrer">
                 Gemini 2.0 native image generation
              </a>
            </p>
          </div>
          
          <menu className="flex items-center bg-gray-300 rounded-full p-2 shadow-sm self-start sm:self-auto">
            <button 
              type="button"
              className="w-10 h-10 rounded-full overflow-hidden mr-2 flex items-center justify-center border-2 border-white shadow-sm transition-transform hover:scale-110"
              onClick={openColorPicker}
              onKeyDown={handleKeyDown}
              aria-label="Open color picker"
              style={{ backgroundColor: penColor }}
            >
              <input
                ref={colorInputRef}
                type="color"
                value={penColor}
                onChange={handleColorChange}
                className="opacity-0 absolute w-px h-px"
                aria-label="Select pen color"
              />
            </button>
            <button
              type="button"
              onClick={clearCanvas}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-white shadow-sm transition-all hover:bg-gray-50 hover:scale-110"
            >
              <Trash2 className="w-5 h-5 text-gray-700" aria-label="Clear Canvas" />
            </button>
          </menu>
        </div>
        
        {/* Canvas section with notebook paper background */}
        <div className="w-full mb-6">
    
              <canvas
                ref={canvasRef}
                width={960}
                height={540}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="border-2 border-black w-full  hover:cursor-crosshair
                h-[70vh] min-h-[400px] bg-white/90"
              />
        </div>
        
        {/* Input form that matches canvas width */}
        <form onSubmit={handleSubmit} className="w-full">
          <div className="relative">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="What should I add?"
              className="w-full p-3 sm:p-4 pr-12 sm:pr-14 text-sm sm:text-base border-2 border-black bg-white text-gray-800 shadow-sm focus:ring-2 focus:ring-gray-200 focus:outline-none transition-all font-mono"
              required
            />
            <button
              type="submit"
              disabled={isLoading}
              className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 rounded-none bg-black text-white hover:cursor-pointer hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <LoaderCircle className="w-5 sm:w-6 h-5 sm:h-6 animate-spin" aria-label="Loading" />
              ) : (
                <SendHorizontal className="w-5 sm:w-6 h-5 sm:h-6" aria-label="Submit" />
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
    </>
  );
}
