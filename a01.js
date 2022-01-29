/*
  Basic File I/O for displaying
  Skeleton Author: Joshua A. Levine
  Modified by: Amir Mohammad Esmaieeli Sikaroudi
  Email: amesmaieeli@email.arizona.edu
  */

  /*
    Course: CSC433 Spring 2022
    Name: Zhengxuan Xie
    Email: xie98@email.arizona.edu
    Homework 1
  */

//access DOM elements we'll use
var input = document.getElementById("load_image");
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');

var width = 0;
var height = 0;
var image_data = 0;
var bytes;

var interval = null;

var ppm_img_data;
var scaleFactor = Math.ceil(Math.sqrt(600 * 600 * 2)); // Width and height for rotated image

//Function to process upload
var upload = function () {
    if (input.files.length > 0) {
        var file = input.files[0];
        console.log("You chose", file.name);
        if (file.type) console.log("It has type", file.type);
        var fReader = new FileReader();
        fReader.readAsBinaryString(file);

        fReader.onload = function(e) {
            //if successful, file data has the contents of the uploaded file
            var file_data = fReader.result;
            parsePPM(file_data);
        }



        /*
        * TODO: ADD CODE HERE TO DO 2D TRANSFORMATION and ANIMATION
        * Modify any code if needed
        * Hint: Write a rotation method, and call WebGL APIs to reuse the method for animation
        */
        
        // Starts with 0
        var angle = 0;

        fReader.onloadend = async function(e){
            clearInterval(interval);
            interval = setInterval(() => {

                var data = image_data.data;
                
                // Create a new Image Data to hold the new image
                var nData = ctx.createImageData(scaleFactor, scaleFactor);
                var cData = nData.data;

                var cx = 300;   // Center X
                var cy = 300;   // Center Y

                translation_x = -125;
                translation_y = -125;
                
                for(let outCol = 0; outCol < scaleFactor; outCol++){
                    for(let outRow = 0; outRow < scaleFactor; outRow++){
                        
                        // Translate * Rotate * Translate * Translate
                        // Magical formula
                        inputRow = Math.round((outRow * Math.cos(angle)) - (outCol * Math.sin(angle)) + ((translation_y * Math.cos(angle) - (translation_x) * Math.sin(angle)) + cx - Math.cos(angle) * cx + Math.sin(angle) * cy));
                        inputCol = Math.round((outRow * Math.sin(angle)) + (outCol * Math.cos(angle)) + ((translation_y * Math.sin(angle) + (translation_x) * Math.cos(angle)) + cy - Math.sin(angle) * cx - Math.cos(angle) * cy));

                        inputIndex = (inputRow * 600 + inputCol) * 4;
                        outputIndex = (outRow  * scaleFactor + outCol) * 4;
                        
                        cData[outputIndex] = data[inputIndex];
                        cData[outputIndex+1] = data[inputIndex+1];
                        cData[outputIndex+2] = data[inputIndex+2];
                        cData[outputIndex+3] = data[inputIndex+3];
                    }
                }
                ctx.putImageData(nData, canvas.width/2 - scaleFactor/2, canvas.height/2 - scaleFactor/2);
                angle += Math.PI / 8;
                if(angle >= Math.PI * 2) angle = 0;
            }, 500);
        }

        

    }
}



// Calculate Roataed Pixel Coordinate
function rotate(x, y, cx, cy, angle){
    let dest_x = x * Math.cos(angle) + y * Math.sin(angle);
    let dest_y = -x * Math.sin(angle) + y * Math.cos(angle);

    return {x: dest_x, y: dest_y};
}


// Load PPM Image to Canvas
function parsePPM(file_data){
    /*
   * Extract header
   */
    var format = "";
    width = 0;
    height = 0;
    var max_v = 0;
    var lines = file_data.split(/#[^\n]*\s*|\s+/); // split text by whitespace or text following '#' ending with whitespace
    var counter = 0;
    // get attributes
    for(var i = 0; i < lines.length; i ++){
        if(lines[i].length == 0) {continue;} //in case, it gets nothing, just skip it
        if(counter == 0){
            format = lines[i];
        }else if(counter == 1){
            width = lines[i];
            //img_width = lines[i];
        }else if(counter == 2){
            height = lines[i];
            //img_height = lines[i];
        }else if(counter == 3){
            max_v = Number(lines[i]);
        }else if(counter > 3){
            break;
        }
        counter ++;
    }
    console.log("Format: " + format);
    console.log("Width: " + width);
    console.log("Height: " + height);
    console.log("Max Value: " + max_v);

    /*
     * Extract Pixel Data
     */
    
    // i-th pixel is on Row i / width and on Column i % width
    // Raw data must be last 3 X W X H bytes of the image file
    var raw_data = file_data.substring(file_data.length - width * height * 3);
    
    bytes = new Uint8Array(3 * width * height);  // i-th R pixel is at 3 * i; i-th G is at 3 * i + 1; etc.

    for(var i = 0; i < width * height * 3; i ++){
        // convert raw data byte-by-byte
        bytes[i] = raw_data.charCodeAt(i);
    }

    // Rescale image if it's not 600x600
    if(width != 600 || height != 600){
        var new_bytes = new Uint8Array(600 * 600 * 3);

        for(var outCol = 0; outCol < 600; outCol++){
            for(var outRow = 0; outRow < 600; outRow++){
                let output_index = outRow * 600 + outCol;
                
                let input_row = Math.round(outRow / 600 * height);
                let input_col = Math.round(outCol / 600 * width);

                let input_index = input_row * width + input_col;
                new_bytes[output_index * 3] = bytes[input_index * 3];
                new_bytes[output_index * 3 + 1] = bytes[input_index * 3 + 1];
                new_bytes[output_index * 3 + 2] = bytes[input_index * 3 + 2];
            }
        }

        bytes = new_bytes;
        width = 600;
        height = 600;
    }
    
    
    // update width and height of canvas
    document.getElementById("canvas").setAttribute("width", window.innerWidth);
    document.getElementById("canvas").setAttribute("height", window.innerHeight);
    // create ImageData object
    image_data = ctx.createImageData(width, height);
    // fill ImageData
    for(var i = 0; i < image_data.data.length; i+= 4){
        let pixel_pos = parseInt(i / 4);
        image_data.data[i + 0] = bytes[pixel_pos * 3 + 0]; // Red ~ i + 0
        image_data.data[i + 1] = bytes[pixel_pos * 3 + 1]; // Green ~ i + 1
        image_data.data[i + 2] = bytes[pixel_pos * 3 + 2]; // Blue ~ i + 2
        image_data.data[i + 3] = 255; // A channel is deafult to 255
    }
    ctx.putImageData(image_data, canvas.width/2 - width/2, canvas.height/2 - height/2);
    ppm_img_data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
}

//Connect event listeners
input.addEventListener("change", upload);