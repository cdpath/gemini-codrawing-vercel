import { useState, useRef, useEffect } from "react";
import { SendHorizontal, LoaderCircle, Trash2, Key, Sparkles } from "lucide-react";
import Head from "next/head";
import { GoogleGenerativeAI } from "@google/generative-ai";

const presetPrompts = [
  {
    category: "🐾 Animals",
    prompts: [
      "🐼 Draw a friendly panda eating bamboo in a magical forest",
      "🐬 Create a playful dolphin jumping through rainbow waves",
      "🐘 Draw a baby elephant playing with butterflies 🦋",
    ]
  },
  {
    category: "🗺️ Adventure",
    prompts: [
      "🏴‍☠️ Draw a treasure map of a magical island with dragons",
      "🚀 Create a spaceship flying through colorful planets ✨",
      "🧜‍♀️ Draw an underwater city with mermaids and sea creatures 🐠",
    ]
  },
  {
    category: "🌟 Fantasy",
    prompts: [
      "🧚‍♀️ Draw a fairy garden with glowing flowers ✨",
      "🐲 Create a friendly dragon teaching baby dragons to fly 🔥",
      "🏰 Draw a magical treehouse with rainbow slides 🌈",
    ]
  },
  {
    category: "🌿 Nature",
    prompts: [
      "🌸 Draw a garden full of giant flowers and tiny creatures 🐞",
      "🦜 Create a rainforest with colorful birds and waterfalls 🌊",
      "🌅 Draw a peaceful meadow with dancing fireflies ✨",
    ]
  }
];

const PresetPromptButton = ({ prompt, onClick }) => (
  <button
    onClick={() => onClick(prompt)}
    className="p-3 text-base bg-white border-2 border-purple-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-all duration-200 text-left hover:scale-102 hover:shadow-md"
  >
    {prompt}
  </button>
);

const PresetPromptsSection = ({ onSelectPrompt }) => (
  <div className="mb-6 space-y-4">
    <div className="flex items-center gap-2 mb-3">
      <span className="text-2xl">✨</span>
      <h2 className="text-lg font-semibold text-purple-700">Drawing Ideas</h2>
    </div>
    <div className="space-y-6">
      {presetPrompts.map((category) => (
        <div key={category.category} className="space-y-2">
          <h3 className="text-lg font-medium text-gray-700">{category.category}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {category.prompts.map((prompt) => (
              <PresetPromptButton
                key={prompt}
                prompt={prompt}
                onClick={onSelectPrompt}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default function Home() {
  const canvasRef = useRef(null);
  const backgroundImageRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState("#000000");
  const colorInputRef = useRef(null);
  const [prompt, setPrompt] = useState("");
  const [generatedImage, setGeneratedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyError, setApiKeyError] = useState("");

  // Check if API key exists in localStorage when component mounts
  useEffect(() => {
    const storedApiKey = localStorage.getItem("geminiApiKey");
    if (storedApiKey) {
      setApiKey(storedApiKey);
    } else {
      setShowApiKeyModal(true);
    }
  }, []);

  // Save API key to localStorage when it changes
  useEffect(() => {
    if (apiKey) {
      localStorage.setItem("geminiApiKey", apiKey);
    }
  }, [apiKey]);

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
    
    // Prevent default behavior to avoid scrolling on touch devices
    if (e.type === 'touchstart') {
      e.preventDefault();
    }
    
    // Start a new path without clearing the canvas
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    
    // Prevent default behavior to avoid scrolling on touch devices
    if (e.type === 'touchmove') {
      e.preventDefault();
    }
    
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
    if (!apiKey) {
      setShowApiKeyModal(true);
      return;
    }
    
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
      
      // Initialize the Gemini API client directly in the browser with user's API key
      const genAI = new GoogleGenerativeAI(apiKey);
      
      // Set responseModalities to include "Image" for image generation
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-exp-image-generation",
        generationConfig: {
          responseModalities: ['Text', 'Image']
        },
      });
      
      // Create image part for the request
      const imagePart = {
        inlineData: {
          data: drawingData,
          mimeType: "image/png"
        }
      };
      
      // Combine drawing with text prompt
      const generationContent = [
        imagePart,
        { text: `${prompt}. Keep the same minimal line doodle style.` || "Add something new to this drawing, in the same style." }
      ];
      
      console.log("Calling Gemini API directly from browser...");
      const response = await model.generateContent(generationContent);
      console.log("Gemini API response received");
      
      // Process response parts
      let imageData = null;
      let message = '';
      
      for (const part of response.response.candidates[0].content.parts) {
        // Based on the part type, either get the text or image data
        if (part.text) {
          message = part.text;
          console.log("Received text response:", part.text);
        } else if (part.inlineData) {
          imageData = part.inlineData.data;
          console.log("Received image data, length:", imageData.length);
        }
      }
      
      if (imageData) {
        const imageUrl = `data:image/png;base64,${imageData}`;
        setGeneratedImage(imageUrl);
      } else {
        console.error("No image data in response");
        alert("Failed to generate image. Please try again.");
      }
    } catch (error) {
      console.error("Error generating image:", error);
      alert(`Error: ${error.message || "Failed to generate image. Please check your API key."}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Add touch event prevention function
  useEffect(() => {
    // Function to prevent default touch behavior on canvas
    const preventTouchDefault = (e) => {
      if (isDrawing) {
        e.preventDefault();
      }
    };

    // Add event listener when component mounts
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('touchstart', preventTouchDefault, { passive: false });
      canvas.addEventListener('touchmove', preventTouchDefault, { passive: false });
    }

    // Remove event listener when component unmounts
    return () => {
      if (canvas) {
        canvas.removeEventListener('touchstart', preventTouchDefault);
        canvas.removeEventListener('touchmove', preventTouchDefault);
      }
    };
  }, [isDrawing]);

  const handleSaveApiKey = () => {
    if (!apiKey || apiKey.trim() === "") {
      setApiKeyError("Please enter a valid API key");
      return;
    }
    setApiKeyError("");
    setShowApiKeyModal(false);
  };

  const openApiKeyModal = () => {
    setShowApiKeyModal(true);
  };

  // Handle preset prompt selection
  const handleSelectPrompt = (selectedPrompt) => {
    setPrompt(selectedPrompt);
  };

  return (
  <>
  <Head>
    <title>Gemini Co-Drawing</title>
    <meta name="description" content="Gemini Co-Drawing" />
    <link rel="icon" href="/favicon.ico" />
  </Head>
  
  {/* API Key Modal */}
  {showApiKeyModal && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-5 md:p-8 max-w-md w-full shadow-xl">
        <h2 className="text-xl font-bold mb-4">Enter your Gemini API Key</h2>
        <p className="text-gray-600 mb-5">
          To use Gemini Co-Drawing, you need to provide your Gemini API key.
          You can get one for free from{" "}
          <a 
            href="https://aistudio.google.com/app/apikey" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            Google AI Studio
          </a>.
        </p>
        
        <div className="mb-5">
          <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
            API Key
          </label>
          <input
            type="text"
            id="apiKey"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="AIzaSyA..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {apiKeyError && <p className="mt-1 text-sm text-red-600">{apiKeyError}</p>}
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={handleSaveApiKey}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Save and Continue
          </button>
        </div>
      </div>
    </div>
  )}
  
  <div className="min-h-screen notebook-paper-bg text-gray-900 flex flex-col justify-start items-center">     
      
      <main className="container mx-auto px-3 sm:px-6 py-5 sm:py-10 pb-32 max-w-5xl w-full">
        {/* Header section with title and tools */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-2 sm:mb-6 gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-0 leading-tight font-mega">Gemini Co-Drawing</h1>
            <p className="text-sm sm:text-base text-gray-500 mt-1">
            Built with{" "}
              <a className="underline" href="https://ai.google.dev/gemini-api/docs/image-generation" target="_blank" rel="noopener noreferrer">
                 Gemini 2.0 native image generation
              </a>
            </p>
            <p className="text-sm sm:text-base text-gray-500 mt-1">
            by{" "}
              <a className="underline" href="https://x.com/trudypainter" target="_blank" rel="noopener noreferrer">
                @trudypainter
              </a>
              {" "}and{" "}
              <a className="underline" href="https://x.com/alexanderchen" target="_blank" rel="noopener noreferrer">
                @alexanderchen
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
              className="w-10 h-10 rounded-full flex items-center justify-center bg-white shadow-sm transition-all hover:bg-gray-50 hover:scale-110 mr-2"
            >
              <Trash2 className="w-5 h-5 text-gray-700" aria-label="Clear Canvas" />
            </button>
            <button
              type="button"
              onClick={openApiKeyModal}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-white shadow-sm transition-all hover:bg-gray-50 hover:scale-110"
              title="Configure API Key"
            >
              <Key className="w-5 h-5 text-gray-700" aria-label="API Key Settings" />
            </button>
          </menu>
        </div>
        
        {/* Preset Prompts Section */}
        <PresetPromptsSection onSelectPrompt={handleSelectPrompt} />
        
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
                className="border-2 border-black w-full  hover:cursor-crosshair sm:h-[60vh]
                h-[30vh] min-h-[320px] bg-white/90 touch-none"
              />
        </div>
        
        {/* Input form that matches canvas width */}
        <form onSubmit={handleSubmit} className="w-full">
          <div className="relative">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Add your change..."
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
