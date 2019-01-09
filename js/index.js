//Global variables
var renderer, scene, camera, particle,controls;
var loader;
var axis = new THREE.Vector3(0, 0.5, 0).normalize();
var speed = 0.01;
var mx = -500;
var sphere, uniforms;
var cubes = [];//Create a new array that will store multiple cubes
var envMap =[];//Create a new array that will store multiple skybox
var displacement, noise;

//audio global variables
var audio,
    analyser,
    audioContext,
    sourceNode,
    stream;
//getting the id elements in the html file
var audioInput = document.getElementById('audiofile');
var audio = document.getElementById("audio");

 var width = window.innerWidth,
     height = window.innerHeight,
     maxHeight = Math.max(height * 0.3, 300),
     fftSize = 512,
     c = 0;

// choose file
audioInput.addEventListener('change', function(event) {
  var files = this.files;
  audio.src = URL.createObjectURL(files[0]);
  setup();
});

//Execute the main functions when the page loads
window.onload = function() {
  init();
  geometry();
  animate();
};

if ( WEBGL.isWebGLAvailable() === false ) {
  document.body.appendChild( WEBGL.getWebGLErrorMessage() );
}


function init(){
  //Configure renderer settings-------------------------------------------------
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio((window.devicePixelRatio) ? window.devicePixelRatio : 1);
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.autoClear = false;
  renderer.setClearColor(0x0f0f0f, 1);
  document.getElementById('canvas').appendChild(renderer.domElement);
  var container = document.getElementById( 'container' );
 container.appendChild( renderer.domElement );
  //----------------------------------------------------------------------------


  // Create an empty scene
  scene = new THREE.Scene();

//Making the Skybox
   envMap[0] = new THREE.CubeTextureLoader().load( [
      'js/textures/Envi/SkyBox1/1.png', // right
      'js/textures/Envi/SkyBox1/2.png', // left
      'js/textures/Envi/SkyBox1/3.png', // top
      'js/textures/Envi/SkyBox1/4.png', // bottom
      'js/textures/Envi/SkyBox1/5.png', // back
      'js/textures/Envi/SkyBox1/6.png' // front
    ] );
    envMap[0].format = THREE.RGBFormat;

    envMap[1] = new THREE.CubeTextureLoader().load( [
       'js/textures/Envi/SkyBox2/1.png', // right
       'js/textures/Envi/SkyBox2/2.png', // left
       'js/textures/Envi/SkyBox2/3.png', // top
       'js/textures/Envi/SkyBox2/4.png', // bottom
       'js/textures/Envi/SkyBox2/5.png', // back
       'js/textures/Envi/SkyBox2/6.png' // front
     ] );
     envMap[1].format = THREE.RGBFormat;

     envMap[2] = new THREE.CubeTextureLoader().load( [
        'js/textures/Envi/SkyBox3/1.png', // right
        'js/textures/Envi/SkyBox3/2.png', // left
        'js/textures/Envi/SkyBox3/3.png', // top
        'js/textures/Envi/SkyBox3/4.png', // bottom
        'js/textures/Envi/SkyBox3/5.png', // back
        'js/textures/Envi/SkyBox3/6.png' // front
      ] );
      envMap[2].format = THREE.RGBFormat;

      envMap[3] = new THREE.CubeTextureLoader().load( [
         'js/textures/Envi/SkyBox4/1.png', // right
         'js/textures/Envi/SkyBox4/2.png', // left
         'js/textures/Envi/SkyBox4/3.png', // top
         'js/textures/Envi/SkyBox4/4.png', // bottom
         'js/textures/Envi/SkyBox4/5.png', // back
         'js/textures/Envi/SkyBox4/6.png' // front
       ] );
       envMap[3].format = THREE.RGBFormat;
//Showing only the first Skybox
scene.background = envMap[0];

  // Create a basic perspective camera
  camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 1, 10000 );
    camera.position.z = 100;
    camera.position.y = 900;
    //Controls for moving around scene
  controls = new THREE.OrbitControls( camera, renderer.domElement );
  scene.add(camera);

  // Create the lights
  var ambientLight = new THREE.AmbientLight(0x999999, 0.5);
  scene.add(ambientLight);

  var lights = [];
      lights[0] = new THREE.DirectionalLight( 0xffffff, 0.5);
      lights[0].position.set(1, 0.5, 0.5);
      lights[1] = new THREE.DirectionalLight( 0x11E8BB, 0.5);
      lights[1].position.set(0.75, 1.5, 0.5);
      lights[2] = new THREE.DirectionalLight( 0x8200C9, 0.5);
      lights[2].position.set(-0.75, -1.5, 0.5);
//Creating Spotlight
  spotLight = new THREE.SpotLight(0x8200C9);
      spotLight.shadow.mapSize.width = 2024;
      spotLight.shadow.mapSize.height = 2024;
  scene.add(spotLight);
  scene.add(lights[0]);
  scene.add( lights[1] );
  scene.add( lights[2] );

// load a texture, set wrap mode to repeat
  var texture = new THREE.TextureLoader().load( "js/textures/speaker.jpg" );//For podium material
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set( 2, 2 );

//Setting up podium
  var geometry = new THREE.BoxGeometry( 800, 7800,800 );
  var material = new THREE.MeshPhongMaterial( {color: 0x404040,map:texture,depthWrite:true,side: THREE.DoubleSide} );
  var podium = new THREE.Mesh( geometry, material );
      podium.position.y= -3900;
      podium.position.z= 65;
  scene.add( podium );

//Setting the texture for the spheres
  uniforms = {
    amplitude: { value: 1.0 },
    color: { value: new THREE.Color( 0xff2200 ) },
    texture: { value: new THREE.TextureLoader().load( "js/textures/water.jpg" ) }
  };

  uniforms.texture.value.wrapS = uniforms.texture.value.wrapT = THREE.RepeatWrapping;

  var shaderMaterial = new THREE.ShaderMaterial( {
    uniforms: uniforms,
    vertexShader: document.getElementById( 'vertexshader' ).textContent,
    fragmentShader: document.getElementById( 'fragmentshader' ).textContent
  } );

  //Creating a two dimensional grid of objects, and positioning them accordingly
  var radius = 50, segments = 128, rings = 64;

  var geometry = new THREE.SphereBufferGeometry( radius, segments, rings );
  displacement = new Float32Array( geometry.attributes.position.count );
  noise = new Float32Array( geometry.attributes.position.count );

  for ( var i = 0; i < displacement.length; i ++ ) {

    noise[ i ] = Math.random() * 5;

  }
  geometry.addAttribute( 'displacement', new THREE.BufferAttribute( displacement, 1 ) );

//Making the sphere an Array
 for (var i = 0; i <= 2; i++) {
  sphere = new THREE.Mesh( geometry, shaderMaterial );
  scene.add( sphere );
    cubes.push(sphere);
    //Setting position of Array
      cubes[i].position.x-=mx;
      cubes[i].position.z-=280;
      cubes[i].position.y=420;
      mx+= 500;
cubes[i].scale.set(3,3,3);
}



window.addEventListener('resize', onWindowResize, false);

window.addEventListener("keypress", checkKeyPress,false);

function checkKeyPress(key){
    //Change background
  if (key.keyCode == "49"){
    scene.background = envMap[1];//Press 1 to change background
  }else if(key.keyCode = "50"){
      scene.background = envMap[2];//Press 2 to change background
}else{
    scene.background = envMap[0];
  }
  //Return to original background
  if (key.keyCode == "52"){
    scene.background = envMap[0];//Press 4 to return to original background
  }else if(key.keyCode == "51"){
    scene.background = envMap[3] //Press 3 to change background
  }
} //End of checkKeyPress
}//End of Init

//Keep everything appearing properly on screen when window resizes
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix(); //maintain aspect ratio
  renderer.setSize(window.innerWidth, window.innerHeight);
}

//Setting up the audio
function setup() {
  audio.addEventListener('canplay', function () {
    document.body.className+='loaded';
    audioContext = new AudioContext();
    analyser = (analyser || audioContext.createAnalyser());
    analyser.minDecibels = -90;
    analyser.maxDecibels = -10;
    analyser.smoothingTimeConstant = 1;//0.75;
    analyser.fftSize = fftSize;

    sourceNode = audioContext.createMediaElementSource(audio);
    sourceNode.connect(analyser);
    sourceNode.connect(audioContext.destination);
update();//call uodate
  });

//changing the rotation of the handle to rest on record
  if (audio.play = true) {
      handle.rotation.y -= 0.9;
    }else{
      handle.rotation.y -= -0.2;
    }

//Here is where using the changing frequency , the sphere's scale is affected
  function update() {
    var freqArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteTimeDomainData(freqArray);

    for (var i = 0; i < freqArray.length; i++) {
      var v = freqArray[i];
for (let i=0; i<cubes.length; i++){
      	// cubes[i].scale.y= v/190;
cubes[i].scale.set(v*1.3/100,v*1.3/100,v*1.3/100 );
         }
   }
    if(audio.play = true){
      record.rotateOnAxis(axis, speed);
    }
console.log(v)//To see the values changing

    requestAnimationFrame(update);

  }

}//end of setup

  audio.play();//Enabling audio to play

function geometry(){
  //Create the geometric objects
  record = new THREE.Object3D();
  //setting up position of vinyl record for smooth rotation
      record.position.x= 65;
      record.position.y= 117;
      record.position.z= 108;
      record.scale.set(13,13,13);

  scene.add(record);

  loader = new THREE.OBJLoader();
  loader.load(
    'vinyl.obj',
    function (obj) {
      record.add(obj)
    }
  )

  var mtlLoader = new THREE.MTLLoader()
  mtlLoader.load(
    'vinyl.mtl',
    function (material) {
      var objLoader = new THREE.OBJLoader()
      objLoader.setMaterials(material)
      objLoader.load(
        'vinyl.obj',
        function (object) {
          record.add(object);
        }
      )
    }
  )
//Setting up the Position of the play hand
  handle = new THREE.Object3D();
    //setting up position for play hand
          handle.position.y= 90;
          handle.position.x= -182;
          handle.position.z= 238;
          handle.scale.set(13,13,13);
  scene.add(handle);
//loading object
  loader = new THREE.OBJLoader();
  loader.load(
    'Handle.obj',
    function (obj) {
      handle.add(obj)
    }
  )

//loading object material
    var mtlLoader = new THREE.MTLLoader()
    mtlLoader.load(
      'Handle.mtl',
      function (material) {
        var objLoader = new THREE.OBJLoader()
        objLoader.setMaterials(material)
        objLoader.load(
          'Handle.obj',
          function (object) {
            handle.add(object);
          }
        )
      }
    )

//Setting up the Position of the record player
 wood = new THREE.Object3D();
 wood.position.z= 120;
wood.scale.set(13,13,13);
  scene.add(wood);

//loading object
  loader = new THREE.OBJLoader();
      loader.load(
          'Wood.obj',
    function (obj) {
      wood.add(obj)
    }
  )
//loading object material
  var mtlLoader = new THREE.MTLLoader()
  mtlLoader.load(
        'Wood.mtl',
    function (material) {
      var objLoader = new THREE.OBJLoader()
      objLoader.setMaterials(material)
      objLoader.load(
        'Wood.obj',
        function (object) {
          wood.add(object);
        }
      )
    }
  )

hands = new THREE.Object3D();
//Setting up the Position of the hands above
  hands.position.y= 540;
  hands.position.z=-840;
  hands.rotation.x= -7.5;
  hands.scale.set(-42,-42,42);
   scene.add(hands);

//loading hand object
   loader = new THREE.OBJLoader();
      loader.load(
          'Hands.obj',
   function (obj) {
      hands.add(obj)
     }
   )


}//end of geometry function





function animate() {
  requestAnimationFrame( animate );
  render();
}//end of animate



function render() {
//Setting up movement for moving sharp Spheres
  var time = Date.now() * 0.01;

  sphere.rotation.y = sphere.rotation.z = 0.01 * time;

  uniforms.amplitude.value = 2.5 * Math.sin( sphere.rotation.y * 0.125 );
  uniforms.color.value.offsetHSL( 0.0005, 0, 0 );

  for ( var i = 0; i < displacement.length; i ++ ) {

    displacement[ i ] = Math.sin( 0.1 * i + time );

    noise[ i ] += 0.5 * ( 0.5 - Math.random() );
    noise[ i ] = THREE.Math.clamp( noise[ i ], - 5, 5 );

    displacement[ i ] += noise[ i ];
  }

  sphere.geometry.attributes.displacement.needsUpdate = true;

//Setting up movement for SpotLight
  let angle = (Math.sin(new Date() * 0.0005)+1)/2*Math.PI;
  let x = Math.cos(angle) * 100;
  let y = Math.sin(angle) * 800;

  spotLight.position.set(x, y, 140);



  renderer.render( scene, camera );
}//end of render
