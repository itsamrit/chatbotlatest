import { streamGemini } from './gemini-api.js';

let form = document.querySelector('form');
let promptInput = document.querySelector('input[name="prompt"]');
let output = document.querySelector('.output');

form.onsubmit = async (ev) => {
  ev.preventDefault();
  output.textContent = 'Generating...';

  try {
    // Get the uploaded image file
    let imageFile = document.getElementById('upload-image').files[0];


    // Convert the image file to base64
    let imageBase64;
    if(imageFile){
      imageBase64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(imageFile);
      });
    }


    // Assemble the prompt by combining the text with the uploaded image
    let contents;
    if (!imageFile){
      contents = [
        {
          role: 'user',
          parts: [
            { text: promptInput.value }
          ]
        }
      ];
    } else {
      contents = [
        {
          role: 'user',
          parts: [
            { inline_data: { mime_type: imageFile.type, data: imageBase64 } },
            { text: promptInput.value }
          ]
        }
      ];
    }

    // Call the gemini-pro-vision model, and get a stream of results
    let stream;
    if(!imageFile){
      stream = streamGemini({
        model: 'gemini-pro',
        contents,
      });
    }
    else{
      stream = streamGemini({
        model: 'gemini-pro-vision',
        contents,
      });
    }

    // Read from the stream and interpret the output as markdown
    let buffer = [];
    let md = new markdownit();
    for await (let chunk of stream) {
      buffer.push(chunk);
      output.innerHTML = md.render(buffer.join(''));
    }
  } catch (e) {
    output.innerHTML += '<hr>' + e;
  }
};
