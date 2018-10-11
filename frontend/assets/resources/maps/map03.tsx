<?xml version="1.0" encoding="UTF-8"?>
<tileset name="map03" tilewidth="512" tileheight="512" tilecount="16" columns="4">
 <image source="map03.png" width="2048" height="2048"/>
 <tile id="0">
  <objectgroup draworder="index">
   <object id="1" x="260" y="-1">
    <properties>
     <property name="boundary_type" value="shelter_z_reducer"/>
    </properties>
    <polyline points="0,0 -16,32 -21,48 -18,54 -20,170 -73,315 8,357 83,316 42,223 25,168 24,33"/>
   </object>
   <object id="2" x="29" y="397">
    <properties>
     <property name="boundary_type" value="barrier"/>
    </properties>
    <polyline points="0,0 232,118 467,1 226,-115"/>
   </object>
  </objectgroup>
 </tile>
 <tile id="1">
  <objectgroup draworder="index">
   <object id="1" x="247" y="182">
    <properties>
     <property name="boundary_type" value="shelter_z_reducer"/>
    </properties>
    <polyline points="0,0 -131,32 -170,91 -167,132 179,133 178,66 100,5 49,3"/>
   </object>
   <object id="2" x="1" y="361">
    <properties>
     <property name="boundary_type" value="barrier"/>
    </properties>
    <polyline points="0,0 250,127 511,1 242,-116"/>
   </object>
  </objectgroup>
 </tile>
 <tile id="4">
  <objectgroup draworder="index">
   <object id="1" x="377" y="416">
    <properties>
     <property name="boundary_type" value="barrier"/>
    </properties>
    <polyline points="0,0 -45,-23 -57,-14 -244,-127 129,-134 135,-64 25,-6"/>
   </object>
   <object id="2" x="321" y="99">
    <properties>
     <property name="boundary_type" value="shelter_z_reducer"/>
    </properties>
    <polyline points="0,0 -190,187 184,179"/>
   </object>
  </objectgroup>
 </tile>
 <tile id="7">
  <objectgroup draworder="index">
   <object id="1" x="0" y="-1">
    <properties>
     <property name="boundary_type" value="barrier"/>
    </properties>
    <polyline points="0,0 0,514 511,513 513,-3"/>
   </object>
  </objectgroup>
 </tile>
</tileset>
