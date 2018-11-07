<?xml version="1.0" encoding="UTF-8"?>
<tileset name="tile_1" tilewidth="64" tileheight="64" tilecount="9" columns="3">
 <image source="tile_1.png" width="192" height="192"/>
 <tile id="1">
  <objectgroup draworder="index">
   <object id="1" x="0" y="1">
    <properties>
     <property name="boundary_type" value="barrier"/>
    </properties>
    <polyline points="0,0 63,-1 63,62 -1,63 0,13"/>
   </object>
  </objectgroup>
 </tile>
 <tile id="4">
  <objectgroup draworder="index">
   <object id="1" x="0" y="-1">
    <properties>
     <property name="boundary_type" value="barrier"/>
    </properties>
    <polyline points="0,0 64,1 65,63 2,65 0,11"/>
   </object>
  </objectgroup>
 </tile>
 <tile id="5">
  <objectgroup draworder="index">
   <object id="1" x="0" y="-1">
    <properties>
     <property name="boundary_type" value="barrie"/>
    </properties>
    <polyline points="0,0 62,1 64,65 1,65 -1,14"/>
   </object>
  </objectgroup>
 </tile>
</tileset>
