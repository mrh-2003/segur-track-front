import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import {parse} from '@babel/parser';
import {createElement as h} from 'react';
import {renderToString} from 'react-dom/server';
import {createServer} from 'vite';

test('las acciones de todas las tablas usan iconos con descripción',()=>{
 const errores=[];let columnas=0;
 const hijos=n=>Object.entries(n).filter(([k])=>!['loc','comments','tokens'].includes(k)).flatMap(([,v])=>Array.isArray(v)?v:v&&typeof v==='object'?[v]:[]);
 function controles(n,file,enAcciones=false){
  if(!n||typeof n!=='object')return;
  if(n.type==='ObjectExpression'){
   const llave=n.properties.find(p=>(p.key?.name||p.key?.value)==='llave');
   if(llave?.value?.value==='acciones'){enAcciones=true;columnas++;}
  }
  if(n.type==='JSXElement'&&n.openingElement.name.name==='td')enAcciones=true;
  if(n.type==='JSXOpeningElement'){
   const nombre=n.name.name,attrs=n.attributes.filter(a=>a.type==='JSXAttribute');
   const clase=attrs.find(a=>a.name.name==='className')?.value?.value;
   if((enAcciones&&['button','Button'].includes(nombre))||(typeof clase==='string'&&clase.split(' ').includes('accion-btn')))
    errores.push(file+':'+n.loc.start.line+' debe usar BotonAccion');
   if(nombre==='BotonAccion'&&!['etiqueta','icono'].every(x=>attrs.some(a=>a.name.name===x)))errores.push(file+':'+n.loc.start.line+' requiere icono y descripción');
  }
  hijos(n).forEach(x=>controles(x,file,enAcciones));
 }
 function recorrer(dir){for(const f of fs.readdirSync(dir,{withFileTypes:true})){
  const p=path.join(dir,f.name);if(f.isDirectory())recorrer(p);else if(p.endsWith('.jsx'))controles(parse(fs.readFileSync(p,'utf8'),{sourceType:'module',plugins:['jsx']}),p);
 }}
 recorrer('src/pages');assert.ok(columnas>=7,'Debe revisar las columnas de acciones de todos los módulos');assert.deepEqual(errores,[]);
});

test('el botón muestra solo un icono y conserva descripción y ayuda de bloqueo',async()=>{
 const vite=await createServer({server:{middlewareMode:true,hmr:false},appType:'custom'});
 try{
  const {BotonAccion}=await vite.ssrLoadModule('/src/components/ui/BotonAccion.jsx');
  const html=renderToString(h(BotonAccion,{etiqueta:'Cambiar sede',icono:'sede'}));
  assert.match(html,/aria-label="Cambiar sede"/);assert.match(html,/title="Cambiar sede"/);assert.match(html,/<svg/);
  assert.doesNotMatch(html,/>Cambiar sede</);
  const bloqueado=renderToString(h(BotonAccion,{etiqueta:'Revisar reporte',icono:'ojo',disabled:true,motivoDeshabilitado:'Primero entregue el reporte.'}));
  assert.match(bloqueado,/<button[^>]*disabled=""/);assert.match(bloqueado,/tabindex="0"/);assert.match(bloqueado,/Primero entregue el reporte/);
 }finally{await vite.close();}
});
