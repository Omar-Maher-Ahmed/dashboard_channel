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



// Initialization
document.addEventListener('DOMContentLoaded', () => {
    initFeeds();
    
    // Slight delay to ensure canvas is properly measured
    setTimeout(() => {
        new ThreatChart('threatChart');
    }, 100);


});
