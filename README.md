# Cosmograph Jupyter Widget

This Jupyter widget integrates the [@cosmograph/cosmograph](https://www.npmjs.com/package/@cosmograph/cosmograph) library, enabling interactive visualizations of complex graphs directly within Jupyter notebooks. Built using the [Anywidget](https://github.com/manzt/anywidget) framework.

## Installation

To install the Cosmograph Jupyter widget, run the following command:

```sh
pip install cosmograph_widget
```

[![PyPI Version](https://img.shields.io/pypi/v/cosmograph_widget)](https://pypi.org/project/cosmograph_widget/)

## Basic Example
Here is a simple example of how to use the Cosmograph Jupyter widget:

```python
from cosmograph_widget import Cosmograph
import pandas as pd

# Define the points of the graph
points = pd.DataFrame([
  { 'index': 0, 'id': '1', 'color': '#88C6FF' },
  { 'index': 1, 'id': '2', 'color': '#FF99D2' },
  { 'index': 2, 'id': '3', 'color': '#E3116C' },
])

# Define the links of the graph
links = pd.DataFrame([
  { 'sourceidx': 0, 'source': '1', 'targetidx': 1, 'target': '2' },
  { 'sourceidx': 0, 'source': '1', 'targetidx': 2, 'target': '3' },
  { 'sourceidx': 1, 'source': '2', 'targetidx': 2, 'target': '3' },
])

# Initialize the Cosmograph widget
cosmo = Cosmograph(points=points, links=links,
   point_id='id',
   point_index='index',
   point_color='color',
   link_source='source',
   link_source_index='sourceidx',
   link_target='target',
   link_target_index='targetidx',
)

# Display the widget
display(cosmo)
```

## Configuration and Customization

The Cosmograph widget offers extensive configuration options to customize its appearance and behavior. For more detailed configuration options, please refer to the [@cosmograph/cosmograph documentation](https://cosmograph.app/docs/cosmograph/Cosmograph%20Library/Cosmograph#passing-the-data-and-configuration).

## Development installation

We'll assume you know how to create and manage virtual environments if you're that type of developper, but it's not necessary.

### Clone the repo

```sh
git clone https://github.com/cosmograph-org/cosmograph_widget
```

or

```sh
git clone git@github.com:cosmograph-org/cosmograph_widget.git
```

### Switch to dev branch

Go to the directory where you installed this

```sh
cd cosmograph_widget
```

Switch to dev branch

```sh
git checkout dev
```

### Install from source


Install the package from source:

```sh
pip install -e ".[dev]"
```

### Rebuild the JS side of the widget package

If you change the python side, effects will be automatic (baring import caching etc.). 
But if you change the JS side and see the effects immediately, you'll need to have some "auto-build-and-load" server running...
From the development root folder, run (assuming `npm` is installed):

```sh
npm run dev
```


Open `example.ipynb` in JupyterLab, VS Code, or your favorite editor
to start developing. Changes made in `js/` will be reflected
in the notebook.
