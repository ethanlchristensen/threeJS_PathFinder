# ThreeJS Path Visualization

Project is hosted live here
<a href="https://ethanlchristensen.github.io/threeJS_PathFinder/">PathFinder</a>

## Description
This project was meant to learn threeJS while also implementing my recent studies (Fall 2022) in uninformed and informed search algorithms.
## Usage/Examples
- Click, hold, and drag mouse to pan around the visualizer
- Scroll in and out to zoom in and out
- Click on the board to place a node, the initial node will be the start node (green), the next will be the end node (red), and each subsequent node will be a wall node (white)
- Press **A** on the keyboard to visualize **A***
- Press **D** on the keyboard to visualize **DFS** (seems to be incorrectly implemented)
- Press **B** on the keyboard to visualize **BFS**
- Press **C** to clear a solution, given one is drawn on the board
- Press **R** to clear the board of all nodes
- Press **W** on the keyboard to visualize a **wave** animation, given the start node is present



The mouse scroll wheel can be used to zoom in and out.

Clicking and holding, and moving the mouse will allow you to rotate the plane in any direction.
## Set up
Head to the Node.js website to download the latest version and get access to npm package installer. Next you will need to install threejs with the following command.

```>> npm3 install three```

Following this, install parcel to host the page

```>> npm3 install parcel```

Now we can download and open up the code. Via command-line, work your way to the folder where the index.html lies, and run the command 

```>> parcel index.html```

This will launch the index.html on ```localhost:1234```
