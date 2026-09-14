This is a Three.js hide and seek game with a Django backend for database and websocket handling. In addition to the built-in raycast tool
allowing the user to capture hiders, the backend executes a vision check to rule out any cheating. In fact the algorithm uses the data
from the renderer to carry out an ulterior verification that the enemy, calculating the visible angle ranges and comparing that with the 
hider's position. This is a good demonstration of algorithmic implementation in the 3D geometric space and eventually a hack-proof layer.
