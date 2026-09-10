"""Download the supplied workbook's team logos, validating all images before replacement."""
import io
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.request import urlopen

import openpyxl
from PIL import Image

FILENAMES = {
    'Pistons': 'det', 'Celtics': 'bos', 'Knicks': 'ny', 'Cavaliers': 'cle',
    'Raptors': 'tor', 'Hawks': 'atl', '76ers': 'phi', 'Magic': 'orl',
    'Hornets': 'cha', 'Heat': 'mia', 'Bucks': 'mil', 'Bulls': 'chi',
    'Nets': 'bkn', 'Pacers': 'ind', 'Wizards': 'wsh', 'Thunder': 'okc',
    'Spurs': 'sas', 'Nuggets': 'den', 'Lakers': 'lal', 'Rockets': 'hou',
    'Timberwolves': 'min', 'Suns': 'phx', 'Trail Blazers': 'por',
    'Clippers': 'lac', 'Warriors': 'gsw', 'Pelicans': 'nop',
    'Mavericks': 'dal', 'Grizzlies': 'mem', 'Kings': 'sac', 'Jazz': 'utah',
}

workbook = openpyxl.load_workbook(sys.argv[1], read_only=True, data_only=True)
rows = list(workbook.active.iter_rows(values_only=True))
headers = list(rows[0])
name_column, url_column = headers.index('en_name'), headers.index('logoLink')
sources = {row[name_column]: row[url_column] for row in rows[1:] if row[name_column]}
assert len(rows) - 1 == len(sources) == 30, 'Expected 30 unique teams'
assert sources.keys() == FILENAMES.keys(), 'Workbook teams do not match local team mapping'


def download(entry):
    name, url = entry
    with urlopen(url, timeout=30) as response:
        data = response.read()
    with Image.open(io.BytesIO(data)) as image:
        assert image.format == 'PNG', f'{name}: expected PNG, got {image.format}'
        size = image.size
        image.verify()
    return name, data, size


with ThreadPoolExecutor(max_workers=4) as pool:
    images = list(pool.map(download, sources.items()))

destination = Path(__file__).resolve().parents[1] / 'public' / 'logos'
assert destination.is_dir()
for name, data, size in images:
    filename = FILENAMES[name] + '.png'
    (destination / filename).write_bytes(data)
    print(f'{name}: {filename} ({size[0]}x{size[1]}, {len(data)} bytes)')
print('Replaced 30 validated PNG images.')
