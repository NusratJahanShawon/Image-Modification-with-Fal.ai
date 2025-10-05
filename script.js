let selectedFile = null;

// File upload handling
const fileUpload = document.getElementById('fileUpload');
const fileInput = document.getElementById('fileInput');

fileUpload.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
    handleFile(e.target.files[0]);
});

fileUpload.addEventListener('dragover', (e) => {
    e.preventDefault();
    fileUpload.classList.add('drag-over');
});

fileUpload.addEventListener('dragleave', () => {
    fileUpload.classList.remove('drag-over');
});

fileUpload.addEventListener('drop', (e) => {
    e.preventDefault();
    fileUpload.classList.remove('drag-over');
    handleFile(e.dataTransfer.files[0]);
});

function handleFile(file) {
    if (file && file.type.startsWith('image/')) {
        selectedFile = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            fileUpload.innerHTML = `
                <img src="${e.target.result}" style="max-width: 100%; max-height: 200px; border-radius: 8px;">
                <p style="margin-top: 10px; color: #667eea; font-weight: 600;">${file.name}</p>
            `;
        };
        reader.readAsDataURL(file);
    }
}

async function generateImage() {
    // Hardcoded API key for public use - replace with your actual API key
    const apiKey = 'YOUR_FAL_AI_API_KEY_HERE'; // Replace this with your actual API key
    
    
    const prompt = document.getElementById('prompt').value.trim();
    const model = document.getElementById('model').value;
    const resultDiv = document.getElementById('result');
    const generateBtn = document.getElementById('generateBtn');

    // Validation
    if (!selectedFile) {
        resultDiv.innerHTML = '<div class="error">⚠️ Please upload an image to transform</div>';
        return;
    }

    if (!prompt) {
        resultDiv.innerHTML = '<div class="error">⚠️ Please describe how you want to transform your image</div>';
        return;
    }

    // Show loading
    generateBtn.disabled = true;
    generateBtn.innerHTML = '🔄 Transforming...';
    resultDiv.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>✨ AI is working its magic on your image...</p>
        </div>
    `;

    try {
        // Convert image to base64
        const base64Image = await fileToBase64(selectedFile);

        // Clean and encode API key to handle special characters
        const cleanApiKey = apiKey.replace(/[^\x00-\x7F]/g, '').trim();
        
        // Call fal.ai API
        const response = await fetch(`https://fal.run/${model}`, {
            method: 'POST',
            headers: {
                'Authorization': `Key ${cleanApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prompt: prompt,
                image_url: base64Image
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('API Error:', data);
            let errorMsg = data.detail || data.error || 'Failed to generate image';
            if (response.status === 402) {
                errorMsg = 'Insufficient credits. Please add credits to your fal.ai account at <a href="https://fal.ai/dashboard" target="_blank">fal.ai/dashboard</a>';
            } else if (response.status === 401) {
                errorMsg = 'Invalid API key. Please check your API key.';
            }
            throw new Error(errorMsg);
        }

        // Display results
        const originalUrl = await fileToDataURL(selectedFile);
        const modifiedUrl = data.images[0].url;

        resultDiv.innerHTML = `
            <div class="success">🎉 Your image has been transformed successfully!</div>
            <div class="preview-section">
                <div class="preview-box">
                    <h3>📸 Original Image</h3>
                    <img src="${originalUrl}" alt="Original">
                </div>
                <div class="preview-box">
                    <h3>✨ Transformed Image</h3>
                    <img src="${modifiedUrl}" alt="Transformed">
                    <a href="${modifiedUrl}" download="transformed-image.png" style="display: inline-block; margin-top: 15px; padding: 12px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 600; transition: all 0.3s ease;">⬇️ Download Result</a>
                </div>
            </div>
        `;

    } catch (error) {
        console.error('Full error:', error);
        let errorMessage = error.message;
        
        if (error.message === 'Failed to fetch') {
            errorMessage = 'Failed to connect to fal.ai. This could be due to:<br>• Insufficient credits in your account<br>• CORS/Network issues<br>• Invalid API key<br><br>Please check your account credits at <a href="https://fal.ai/dashboard" target="_blank">fal.ai/dashboard</a>';
        }
        
        resultDiv.innerHTML = `<div class="error">❌ Error: ${errorMessage}</div>`;
    } finally {
        generateBtn.disabled = false;
        generateBtn.innerHTML = '🚀 Transform My Image';
    }
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function fileToDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
