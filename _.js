//// Keep track of pressed keys ////

// keycodes stored to movement vector
// w:83, s:87, 65:a, 68:d
var key_codes = {
    87: [0,-1],
    65: [-1,0],
    83: [0,1],
    68: [1,0]
}

// keys currently pressed
var keys_down = {}

// adds key to keys_down when called
function keydown(key) {
    var k = key.keyCode || key.which;
    keys_down[k] = true;
}

// removes key from keys_down when called
function keyup(key) {
    var k = key.keyCode || key.which;
    keys_down[k] = false;
}

// key detection listener
function startInputController() {
    document.addEventListener('keydown', keydown);
    document.addEventListener('keyup', keyup);
}

startInputController();


//// System to manage terrain ////

let terrainCache = {};

const PI = Math.PI;

// chunk size/resolution setting
CHUNKSIZE = 8;
CHUNKRES = 4;
// declaring a default empty chunk
CHUNK = new THREE.PlaneGeometry(CHUNKSIZE, CHUNKSIZE, CHUNKRES, CHUNKRES);
CHUNK.rotateX(-PI/2);
// Render settings, radius in tiles
LOADDISTANCE = 3
CULLDISTANCE = 6

MOVESPEED = 0.3;

function terrainGen(x, z) {
	return Math.sin(x*.2+z*.25) * 1.5
}

function renderChunk(x, z) {
	terrainCache[[x, z]] = new THREE.Mesh(CHUNK.clone(), new THREE.MeshNormalMaterial({wireframe: true}));	
	terrainCache[[x, z]].translateX(x * CHUNKSIZE);
	terrainCache[[x, z]].translateZ(z * CHUNKSIZE);
	
	var verts = terrainCache[[x, z]].geometry.vertices;
	
	for (v in verts) {
		terrainCache[[x, z]].geometry.vertices[v].y = terrainGen(verts[v].x + x * CHUNKSIZE, verts[v].z + z * CHUNKSIZE);
	}
	scene.add(terrainCache[[x, z]]);
}

// function responsible for loading and unloading tiles relative to player position
function terrainLOD() {
	var ppos = player.getWorldPosition(); 
    ppos.divideScalar(CHUNKSIZE).floor(); // floor divides the player position so that it fits nicely into the integer based indexing system
	// iterate over every tile around the player within render distance and loads them if they are not already in terrainCache	
	for (x = -LOADDISTANCE; x <= LOADDISTANCE; x++) {
		for (z = -LOADDISTANCE; z <= LOADDISTANCE; z++) {
			if (terrainCache[[x + ppos.x, z + ppos.z]] == undefined) {
				renderChunk(x + ppos.x, z + ppos.z);
			}
		}
	}
	// iterate over all cached tiles and remove tiles that exceed culling distance
	for (tile in terrainCache) {
		i = {x: +(tile.split(',')[0]), z: +(tile.split(',')[1])}
		if ((terrainCache[tile] != undefined) & (!(ppos.x-CULLDISTANCE < i.x) | !(i.x < ppos.x+CULLDISTANCE) | !(ppos.z-CULLDISTANCE < i.z) | !(i.z < ppos.z+CULLDISTANCE))) {
			scene.remove(terrainCache[tile]);
			delete terrainCache[tile];
			console.log('trigged');
		}
	}
}

//// Player movement ////

// create player
var player = new THREE.Mesh(new THREE.CubeGeometry(), new THREE.MeshBasicMaterial({color: 0x55cc99}));
scene.add(player);

function move_controller() {
    var v = [0, 0];
    for (var n in key_codes) {
        if (keys_down[n] == true) {
            v[0] += key_codes[n][0];
            v[1] += key_codes[n][1];
        }
    }
    if (v != [0, 0]) {
        player.translateX(v[0] * MOVESPEED);
		player.translateZ(v[1] * MOVESPEED);
    }
}

// main loop
function update( event ) {
	move_controller();
	terrainLOD();
}