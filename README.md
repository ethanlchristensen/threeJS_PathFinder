# ThreeJS Path Visualization

Project is hosted live here
<a href="https://ethanlchristensen.github.io/">PathFinder</a>

## Description
This project was meant to learn threeJS while also implementing my recent studies (Fall 2022) in uninformed and informed search algorithms.
## Set up
Head to the Node.js website to download the latest version and get access to npm package installer. Next you will need to install threejs with the following command.

```>> npm3 install three```

Following this, install parcel to host the page

```>> npm3 install parcel```

Now we can download and open up the code. Via command-line, work your way to the folder where the index.html lies, and run the command 

```>> parcel index.html```

This will launch the index.html on ```localhost:1234```

## Usage
The system is relatively intuitive to use. Hovering over the plane will highlight the current square you are on. Clicking will place a block. If the start block (colored green) isn't present, it will be the next one placed. If the end block (colored red) isn't present, it will be the next placed. After this, each block placed will be a wall block (colored white).

```Enter```<br/>
>Initiates the path-finding algorithm. If either the start or end block is not placed, the plane will flash red and the pathfinding algorithm will not execute. If a path doesn't exist between the start and end block, the plane will flash red. If a solution is found, a path will be drawn between the two blocks and the plane will flash green. 

```R```<br/>
>Reset the plane and remove all blocks.<br/>

```C```<br/>
>Clear the populated solution without removing walls or start/end blocks.<br/>
>Flashes red if there is no solution on the board.<br/>
>Once complete, it will intiate a green wave across the board.<br/>

```W```<br/>
>Will iniate a multi color wave such that the start block is present.<br/>
>Will flash Red otherwise.<br/>

The mouse scroll wheel can be used to zoom in and out.

Clicking and holding, and moving the mouse will allow you to rotate the plane in any direction.

In the script.js, at the top of the file is a parameter called ```N``` for board size, ```ani``` to toggle the animations, and ```paintTrail``` to toggle a  paint trail for the rotating finder cube.
## Current Version
Currently, the program uses an A* path-finding algorithm. Future implementation will allow for the selection of different path-finding algorithms as well as visualizing the fringe.
