
import { useEffect, useRef, useState } from 'react'
import axios from 'axios';
import './App.css'

export default function App() {

  // Ollama URL - works in both dev and Docker
  const OLLAMA_URL = import.meta.env.VITE_OLLAMA_URL || 'http://127.0.0.1:11434';

  const [file, setFile] = useState(null);
  const [previewFileURL, setPreviewFileURL] = useState(null);
  const [captions, setCaptions] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const blobURLRef = useRef('');
  const [streamMode, setStreamMode] = useState(false);

  useEffect(()=>{

    if(blobURLRef.current){
      URL.revokeObjectURL(blobURLRef.current)
    }
    let blobURL = null;
    if(file){
      blobURL = URL.createObjectURL(file);
      setPreviewFileURL(blobURL);
      blobURLRef.current = blobURL;
    }

  }, [file])

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  }

  // Get the caption from the image in non-stream mode
  const getCaptionNonStream = async() => {
    setIsLoading(true);
    setCaptions('');

    const fileReader = new FileReader();
    fileReader.readAsDataURL(file);

    fileReader.onload = async () => {
      const base64String = fileReader.result.split(',')[1];
      try {
        const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
          model: 'gemma3:4b',
          prompt: `Give me an instagram caption for this image under 100 words. 
                    Make sure to give me just the caption and no other text. 
                    Try to provide best 3 captions in a list format. 
                    If you are not sure about the caption, just say "I am not sure about the caption" and do not provide any other text.
                    Also include hastag if relevant.`,
          images: [base64String],
          stream: false
        });
        const ollamaResponse = response.data.response;
        setCaptions(ollamaResponse);
      } catch (error) {
        console.error('Error calling Ollama:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fileReader.onerror = (error) => {
      console.error('Error reading file:', error);
      setIsLoading(false);
    }
  }

  // Get the caption from the image in stream mode
  const getCaptionStream = async() => {

    // Convert file to base64
    const fileReader = new FileReader();  // Renamed to avoid collision
    fileReader.readAsDataURL(file);
    
    fileReader.onload = async () => {
      // Remove the data URL prefix (e.g., "data:image/png;base64,")
      const base64String = fileReader.result.split(',')[1];
      
      try {
        // Use fetch() instead of axios for streaming
        const response = await fetch(`${OLLAMA_URL}/api/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gemma3:4b',
            prompt: `Give me an instagram caption for this image under 100 words. 
                      Make sure to give me just the caption and no other text. 
                      Try to provide best 3 captions in a list format. 
                      If you are not sure about the caption, just say "I am not sure about the caption" and do not provide any other text.
                      Also include hastag if relevant.`,
            images: [base64String],
            stream: true
          })
        });

        // Get the readable stream
        const streamReader = response.body.getReader();
        const decoder = new TextDecoder();
        let caption = '';

        while (true) {
          const { done, value } = await streamReader.read();
          if (done) break;

          // Decode the chunk
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.trim());

          // Process each line (each is a JSON object)
          for (const line of lines) {
            try {
              const json = JSON.parse(line);
              if (json.response) {
                caption += json.response;
                // Update caption progressively for typing effect
                setCaptions(caption);
              }
            } catch (e) {
              // Skip invalid JSON lines
            }
          }
        }
      } catch (error) {
        console.error('Error calling Ollama:', error);
      }
    };

    fileReader.onerror = (error) => {
      console.error('Error reading file:', error);
    };
  }

  const getCaption = async() => {
    if(!file) {
      console.error('No file selected');
      return;
    }

    if(streamMode) {
      getCaptionStream();
    } else {
      getCaptionNonStream();
    }
  }

  const handleClick = (e) => {
    getCaption();
  }
 

  return (
    <>
      <div>
        <input type='file' onChange={handleFileChange}></input>
        <img src={previewFileURL}></img>
      </div>
      
      <button onClick={handleClick} disabled={isLoading || !file}>
        {isLoading ? 'Generating...' : 'Get me the caption!'}
      </button>

      {isLoading && (
        <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="spinner"></div>
          <span>Generating caption...</span>
        </div>
      )}

      {captions && !isLoading && (
        <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #ccc' }}>
          <h3>Generated Caption:</h3>
          <p style={{ whiteSpace: 'pre-wrap' }}>{captions}</p>
        </div>
      )}

    </>
  )
}

