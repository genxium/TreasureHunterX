<?xml version="1.0" encoding="UTF-8"?>
<tileset name="map02" tilewidth="128" tileheight="128" tilecount="64" columns="8">
 <image source="map02.png" width="1024" height="1024"/>
 <tile id="0">
  <objectgroup draworder="index">
   <object id="1" x="70.5" y="11">
    <properties>
     <property name="boundary_type" value="shelter_z_reducer"/>
    </properties>
    <polyline points="0,0 -46.5,16.5 -46,79 -6,93 35.5,75.5 34.5,19.5"/>
   </object>
   <object id="2" x="45.5" y="102">
    <properties>
     <property name="boundary_type" value="barrier"/>
    </properties>
    <polyline points="0,0 -14,10 20.5,29 57.5,6.5 16.5,-16.5"/>
   </object>
  </objectgroup>
 </tile>
 <tile id="1">
  <objectgroup draworder="index">
   <object id="1" x="109" y="29">
    <polyline points="0,0 -110,69 -110,88 -81,103 -64,98 19,49 19,14"/>
   </object>
  </objectgroup>
 </tile>
 <tile id="12">
  <objectgroup draworder="index">
   <object id="1" x="57.5" y="12.5">
    <properties>
     <property name="boundary_type" value="shelter_z_reducer"/>
    </properties>
    <polyline points="0,0 -24,63.5 -22,85 2.5,94.5 28.5,80.5 10,7.5"/>
   </object>
   <object id="2" x="45.5" y="119">
    <properties>
     <property name="boundary_type" value="barrier"/>
    </properties>
    <polyline points="0,0 17.5,8.5 32,-1 29,-10 1.5,-10.5"/>
   </object>
  </objectgroup>
 </tile>
 <tile id="44">
  <animation>
   <frame tileid="2" duration="300"/>
   <frame tileid="10" duration="300"/>
   <frame tileid="11" duration="300"/>
   <frame tileid="18" duration="300"/>
   <frame tileid="26" duration="300"/>
   <frame tileid="42" duration="300"/>
  </animation>
 </tile>
</tileset>
