// Data fetching logic
async function loadFeed(url, elementId) {
    const container = document.getElementById(elementId);
    if (!container) return;

    // Show skeletons
    container.innerHTML = Array(4).fill('<div class="skeleton"></div>').join('');

    try {
        const api = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`;
        const response = await fetch(api);
        const data = await response.json();

        container.innerHTML = '';

        if (!data.items || data.items.length === 0) {
            container.innerHTML = '<li><a href="#">No recent updates</a></li>';
            return;
        }

        data.items.slice(0, 5).forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `<a href="${item.link}" target="_blank">${item.title}</a>`;
            container.appendChild(li);
        });

    } catch (e) {
        console.error('Failed to load feed:', e);
        container.innerHTML = '<li><a href="#" style="color: #ef4444;">Failed to load feed</a></li>';
    }
}

function initFeeds() {
    const feeds = [
        { url: 'https://feeds.feedburner.com/TheHackersNews', id: 'cyber' },
        { url: 'https://www.phoronix.com/rss.php', id: 'linux' },
        { url: 'https://techcrunch.com/feed/', id: 'tech' },
        { url: 'https://www.bleepingcomputer.com/feed/', id: 'leaks' },
        { url: 'https://www.artificialintelligence-news.com/feed/', id: 'ai' },
        { url: 'https://www.theverge.com/rss/index.xml', id: 'companies' }
    ];

    feeds.forEach(feed => loadFeed(feed.url, feed.id));

    // Refresh every 5 minutes
    setInterval(() => {
        feeds.forEach(feed => loadFeed(feed.url, feed.id));
    }, 300000);
}

// Chart Logic
class ThreatChart {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.data = Array.from({ length: 6 }, () => Math.floor(Math.random() * 25) + 5);
        
        // Handle resize mapping
        window.addEventListener('resize', () => this.resize());
        this.resize();
        
        this.animate();
        setInterval(() => this.updateData(), 3000);
    }
    
    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = 150;
        this.draw();
    }

    updateData() {
        this.data.shift();
        this.data.push(Math.floor(Math.random() * 25) + 5);
        this.draw();
    }

    draw() {
        const { width, height } = this.canvas;
        this.ctx.clearRect(0, 0, width, height);

        // Styling
        this.ctx.strokeStyle = '#38bdf8';
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        // Draw Line
        this.ctx.beginPath();
        const step = width / (this.data.length - 1);
        
        this.ctx.moveTo(0, height - (this.data[0] * 5));
        
        for (let i = 1; i < this.data.length; i++) {
            // Smooth curve
            const xc = (step * (i - 1) + step * i) / 2;
            const yc = (height - (this.data[i - 1] * 5) + height - (this.data[i] * 5)) / 2;
            this.ctx.quadraticCurveTo(step * (i - 1), height - (this.data[i - 1] * 5), xc, yc);
            
            if (i === this.data.length - 1) {
                this.ctx.quadraticCurveTo(xc, yc, step * i, height - (this.data[i] * 5));
            }
        }
        
        this.ctx.stroke();

        // Fill gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, 'rgba(56, 189, 248, 0.4)');
        gradient.addColorStop(1, 'rgba(56, 189, 248, 0.0)');
        
        this.ctx.lineTo(width, height);
        this.ctx.lineTo(0, height);
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
    }
}


// AI Analysis Logic
async function analyzeData() {
    const container = document.getElementById('aiAnalysis');
    const apiKeyInput = document.getElementById('apiKey');
    const analyzeBtn = document.getElementById('analyzeBtn');

    const apiKey = apiKeyInput ? apiKeyInput.value.trim() : '';

    if (apiKey) {
        localStorage.setItem('thalorix_api', apiKey);
    } else {
        container.innerHTML = '<span style="color:#ef4444">⚠️ Please enter an OpenRouter API Key</span>';
        return;
    }

    container.innerHTML = '<div style="display:flex;align-items:center;gap:10px;"><div class="skeleton" style="width:20px;height:20px;border-radius:50%;margin:0;"></div> Analyzing recent threat patterns...</div>';
    analyzeBtn.disabled = true;
    analyzeBtn.style.opacity = '0.7';

    // Collect recent titles from lists
    const links = Array.from(document.querySelectorAll('ul li a')).map(a => a.textContent).slice(0, 50).join('\n');
    let textToAnalyze = links.slice(0, 3000); // safety wrapper
    
    if(!textToAnalyze.trim()) textToAnalyze = "No recent data loaded.";

    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': window.location.origin,
                'X-Title': 'Thalorix Dashboard'
            },
            body: JSON.stringify({
                model: 'google/gemini-2.5-flash', 
                messages: [
                    {
                        role: 'system',
                        content: 'You are an elite cybersecurity threat analyst. Briefly summarize the key threats from the provided news headlines and highlight most important risks in a short, punchy paragraph. Use bullet points for top 3 threats.'
                    },
                    {
                        role: 'user',
                        content: textToAnalyze
                    }
                ]
            })
        });

        const data = await response.json();

        if (data.error) {
            container.innerHTML = `<span style="color:#ef4444">❌ API Error: ${data.error.message}</span>`;
        } else {
            const result = data.choices?.[0]?.message?.content || 'No analysis returned';
            // Parse markdown slightly
            container.innerHTML = result.replace(/\n\n/g, '<br><br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        }

    } catch (e) {
        console.error(e);
        container.innerHTML = '<span style="color:#ef4444">❌ AI Request Failed (Check Console)</span>';
    } finally {
        analyzeBtn.disabled = false;
        analyzeBtn.style.opacity = '1';
    }
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    initFeeds();
    
    // Slight delay to ensure canvas is properly measured
    setTimeout(() => {
        new ThreatChart('threatChart');
    }, 100);

    // Load saved API key
    const apiKeyInput = document.getElementById('apiKey');
    if (apiKeyInput && localStorage.getItem('thalorix_api')) {
        apiKeyInput.value = localStorage.getItem('thalorix_api');
    }
});
