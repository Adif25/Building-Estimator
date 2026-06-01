from flask import Flask, request, jsonify
from scrapling.fetchers import StealthyFetcher
import re

app = Flask(__name__)
fetcher = StealthyFetcher()

PRICE_SELECTORS = [
    '[data-testid="price"]',
    '.price',
    '#price',
    'span[itemprop="price"]',
]


def extract_price_from_page(page):
    for selector in PRICE_SELECTORS:
        el = page.find(selector)
        if el:
            text = el.get_all_text(separator=' ')
            match = re.search(r'\$?([\d,]+\.?\d*)', text.replace(',', ''))
            if match:
                return float(match.group(1))

    # Fallback: search all text for first dollar amount
    all_text = page.get_all_text(separator=' ')
    match = re.search(r'\$\s*([\d,]+\.\d{2})', all_text)
    if match:
        return float(match.group(1).replace(',', ''))

    return None


def extract_price_from_search(query):
    url = f"https://www.homedepot.com/s/{query.replace(' ', '%20')}"
    try:
        page = fetcher.fetch(url)
        price = extract_price_from_page(page)
        return price
    except Exception as e:
        raise RuntimeError(f"Scraping failed: {e}")


@app.route('/price')
def get_price():
    query = request.args.get('q', '').strip()
    if not query:
        return jsonify({'error': 'Missing query parameter q'}), 400

    try:
        price = extract_price_from_search(query)
        if price is not None:
            return jsonify({'price': price, 'source': 'homedepot'})
        return jsonify({'price': None, 'source': 'not_found'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/health')
def health():
    return jsonify({'status': 'ok'})


if __name__ == '__main__':
    app.run(port=5001, debug=False)
