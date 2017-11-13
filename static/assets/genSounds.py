import fileinput
import json

assets = []
for line in fileinput.input():
   line = line.strip();
   key = line[0 : line.find('.')] + '-audio';
   url = "sounds/" + line;
   typ = "audio";
   assets.append( {
      "key" : key,
      "url" : url,
      "type" : typ
   })

print json.dumps( assets )


