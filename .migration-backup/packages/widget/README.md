# NorskBot Widget

Lightweight embeddable chat widget (< 30KB minified + gzipped).

## Installation

### For End Users

Add this single line to your website:

```html
<script src="https://api.norsk-chatbot.no/widget.js" data-site-id="YOUR_SITE_ID"></script>
```

### For Developers

```bash
npm install @norsk-chatbot/widget
npm run dev      # Development server
npm run build    # Production build
```

## Configuration

The widget accepts the following data attributes:

```html
<script 
  src="https://api.norsk-chatbot.no/widget.js" 
  data-site-id="YOUR_SITE_ID"
  data-api-url="https://api.example.com"
></script>
```

- `data-site-id` (required): Your site ID from the dashboard
- `data-api-url` (optional): Custom API URL (defaults to norsk-chatbot.no)

## Features

- ✅ Vanilla JavaScript (no framework dependencies)
- ✅ < 30KB minified + gzipped
- ✅ Floating chat button
- ✅ Responsive (desktop, tablet, mobile)
- ✅ Keyboard shortcut (Cmd+I / Ctrl+I)
- ✅ Session persistence
- ✅ Dark mode support (coming soon)
- ✅ Customizable colors and text
- ✅ Source citations

## Development

### Project Structure

```
widget/
├── src/
│   ├── index.js      # Entry point
│   ├── chat.js       # Widget component
│   └── styles.css    # Widget styles
├── build/            # Compiled output
└── package.json
```

### Build Process

The widget is built as a single minified JS file that can be embedded anywhere:

```bash
npm run build
# Output: build/widget.min.js (size < 30KB)
```

## API Integration

The widget communicates with the API using these endpoints:

```
GET /v1/widget/:siteId      - Load widget configuration
POST /v1/chat/message       - Send message and get response
POST /v1/chat/feedback      - Submit feedback
```

## Browser Support

- Chrome / Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Android)

## Performance

- Load time: < 1 second
- First response: < 5 seconds
- Bundle size: 25-30 KB minified + gzipped
- No external dependencies (Axios included in bundle)

## Privacy

- No cookies set by default
- Session data stored in localStorage (can be cleared by user)
- GDPR compliant
- No tracking pixels or analytics

## Debugging

Enable debug mode by adding to the script tag:

```html
<script 
  src="https://api.norsk-chatbot.no/widget.js"
  data-site-id="YOUR_SITE_ID"
  data-debug="true"
></script>
```

## Troubleshooting

**Widget doesn't show up:**
- Check if your site ID is correct
- Check browser console for errors
- Verify CORS is enabled on your API

**Messages not being sent:**
- Check if API URL is reachable
- Check network tab in browser dev tools
- Verify site ID has access to API

## License

Proprietary - All rights reserved
