# Caption Generator 📸

An AI-powered web application that generates captions for your images using Ollama's vision language models.

## 🎯 Features

- **AI-Powered Captions**: Generates creative captions using Ollama's `gemma3:4b` model
- **Image Upload**: Simple drag-and-drop or file selection interface
- **Live Preview**: See your image before generating captions
- **Streaming Mode**: Watch captions generate in real-time with ChatGPT-style typing effect
- **Non-Streaming Mode**: Get complete captions instantly
- **Loading States**: Visual feedback with animated spinner during generation
- **Multiple Caption Options**: Generates 3 caption suggestions per image
- **Hashtag Suggestions**: Automatically includes relevant hashtags

## 🛠️ Tech Stack

- **Frontend**: React 19 + Vite
- **AI Model**: Ollama (gemma3:4b vision model)
- **HTTP Client**: axios & fetch API
- **Styling**: CSS with custom animations
- **File Handling**: FileReader API for image processing

## 📋 Prerequisites

Before running this project, make sure you have:

1. **Node.js** (v16 or higher)
2. **Ollama** installed and running locally
   - [Install Ollama](https://ollama.ai/)
   - Pull the vision model:
     ```bash
     ollama pull gemma3:4b
     ```
3. **Ollama server** running on `http://127.0.0.1:11434`
   ```bash
   ollama serve
   ```

## 🚀 Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd caption-generator-client
   ```
2. **Install dependencies**

   ```bash
   npm install
   ```
3. **Start the development server**

   ```bash
   npm run dev
   ```
4. **Open your browser**

   - Navigate to `http://localhost:5173` (or the URL shown in terminal)

## 📖 Usage

1. **Upload an Image**

   - Click the file input and select an image
   - Preview will appear automatically
2. **Generate Caption**

   - Click "Get me the caption!" button
   - Watch the AI generate captions in real-time
3. **Copy & Use**

   - Select your favorite caption from the 3 generated options
   - Copy and use on Instagram!

## 🎨 How It Works

### Image Processing Flow

```
User uploads image → FileReader converts to base64 → 
Sent to Ollama API → AI processes image → 
Captions streamed back → Display on UI
```

### Streaming vs Non-Streaming

**Streaming Mode** (Default):

- Uses `fetch()` API with ReadableStream
- Shows progressive text generation (typing effect)
- Better UX for longer responses

**Non-Streaming Mode**:

- Uses `axios` for simpler HTTP request
- Waits for complete response
- Faster for short captions

## 🔧 Configuration

### Change AI Model

Edit the model in `src/App.jsx`:

```javascript
model: 'gemma3:4b',  // Change to your preferred model
```

### Customize Prompt

Modify the prompt in both `getCaptionNonStream` and `getCaptionStream`:

```javascript
prompt: `Your custom prompt here...`
```

### Adjust API Endpoint

Update the Ollama endpoint if running on different host:

```javascript
// Change from
'http://127.0.0.1:11434/api/generate'

// To your endpoint
'http://your-host:port/api/generate'
```

## 📦 Build for Production

```bash
# Create optimized production build
npm run build

# Preview production build locally
npm run preview
```

The build output will be in the `dist/` directory.

## 🧪 Available Scripts

| Command             | Description              |
| ------------------- | ------------------------ |
| `npm run dev`     | Start development server |
| `npm run build`   | Create production build  |
| `npm run preview` | Preview production build |
| `npm run lint`    | Run ESLint               |

## 🏗️ Project Structure

```
caption-generator-client/
├── src/
│   ├── App.jsx          # Main application component
│   ├── App.css          # Styles including spinner animation
│   └── main.jsx         # React entry point
├── public/              # Static assets
├── package.json         # Dependencies and scripts
├── vite.config.js       # Vite configuration
└── README.md           # This file
```

## 🌟 Key Features Explained

### FileReader API

Converts uploaded images to base64 format for API transmission:

```javascript
const reader = new FileReader();
reader.readAsDataURL(file);
reader.onload = () => {
  const base64 = reader.result.split(',')[1];
  // Send to API
};
```

### Streaming with ReadableStream

Progressive response display using Web Streams API:

```javascript
const reader = response.body.getReader();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  // Process chunk and update UI
}
```

### Loading States

Visual feedback during AI generation:

- Disabled button with "Generating..." text
- Animated CSS spinner
- Conditional rendering based on `isLoading` state

## 🐛 Troubleshooting

### Ollama Connection Error

**Problem**: Can't connect to Ollama
**Solution**:

- Ensure Ollama is installed: `ollama --version`
- Start Ollama server: `ollama serve`
- Verify model is pulled: `ollama list`

### Model Not Found

**Problem**: `model 'gemma3:4b' not found`
**Solution**:

```bash
ollama pull gemma3:4b
```

### CORS Errors

**Problem**: CORS policy blocking requests
**Solution**: Ollama allows localhost by default, but if issues persist:

- Check Ollama is on `127.0.0.1:11434`
- Restart Ollama service

### Image Not Uploading

**Problem**: Preview not showing
**Solution**:

- Check file is a valid image format (jpg, png, gif, webp)
- Check browser console for errors
- Verify file size isn't too large (>10MB may cause issues)

## 🔒 Security Notes

- Images are processed locally and sent to your local Ollama instance
- No data is sent to external servers
- Base64 encoding increases size by ~33% - consider image size limits
- For production, implement proper error handling and input validation

## 🤝 Contributing

Contributions are welcome! Feel free to:

- Report bugs
- Suggest features
- Submit pull requests

## 📝 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- [Ollama](https://ollama.ai/) for the amazing local LLM platform
- [Vite](https://vitejs.dev/) for the blazing fast build tool
- [React](https://react.dev/) for the UI framework

## 📚 Learn More

- [Ollama Documentation](https://github.com/ollama/ollama/blob/main/docs/api.md)
- [FileReader API](https://developer.mozilla.org/en-US/docs/Web/API/FileReader)
- [ReadableStream API](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream)
- [Vite Guide](https://vitejs.dev/guide/)

---

**Built with ❤️ using React, Vite, and Ollama**
