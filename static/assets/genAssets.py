import fileinput
import json

assets = []
for line in fileinput.input():
   line = line.strip();
   key = line[0 : line.find('.')];
   url = "img/" + line;
   typ = "image";
   assets.append( {
      "key" : key,
      "url" : url,
      "type" : typ
   })

print json.dumps( assets )


