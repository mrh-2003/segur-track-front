import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import {parse} from '@babel/parser';
import {createElement} from 'react';
import {renderToString} from 'react-dom/server';
import {createServer} from 'vite';

test('todos los controles bloqueables declaran el motivo del bloqueo',()=>{
  const internos=new Set(['Button.jsx','Input.jsx','Select.jsx','AyudaControl.jsx','BotonAccion.jsx']);
  const pendientes=[];
  function inspeccionar(n,file){
    if(!n||typeof n!=='object')return;
    if(n.type==='JSXOpeningElement'){
      const atributos=n.attributes.filter(a=>a.type==='JSXAttribute').map(a=>a.name.name);
      if(atributos.includes('disabled')&&!atributos.includes('hidden')&&!atributos.includes('motivoDeshabilitado'))pendientes.push(file+':'+n.loc.start.line);
    }
    for(const [k,v]of Object.entries(n))if(!['loc','comments','tokens'].includes(k)){
      if(Array.isArray(v))v.forEach(x=>inspeccionar(x,file));else if(v&&typeof v==='object')inspeccionar(v,file);
    }
  }
  function recorrer(dir){for(const f of fs.readdirSync(dir,{withFileTypes:true})){
    const file=path.join(dir,f.name);
    if(f.isDirectory())recorrer(file);
    else if(file.endsWith('.jsx')&&!internos.has(f.name))inspeccionar(parse(fs.readFileSync(file,'utf8'),{sourceType:'module',plugins:['jsx']}),file);
  }}
  recorrer('src');
  assert.deepEqual(pendientes,[],'Un control deshabilitado debe explicar qué falta: '+pendientes.join(', '));
});

test('la ayuda es accesible y conserva el bloqueo nativo del botón y del selector',async()=>{
  const vite=await createServer({server:{middlewareMode:true,hmr:false},appType:'custom'});
  try{
    const {Button}=await vite.ssrLoadModule('/src/components/ui/Button.jsx');
    const {Select}=await vite.ssrLoadModule('/src/components/ui/Select.jsx');
    const html=renderToString(createElement(Button,{disabled:true,motivoDeshabilitado:'Primero seleccione un agente.'},'Guardar asignación'));
    assert.match(html,/<button[^>]*disabled=""/);
    assert.match(html,/tabindex="0"/);
    assert.match(html,/aria-describedby=/);
    assert.match(html,/Primero seleccione un agente/);
    const select=renderToString(createElement(Select,{nombre:'agente',disabled:true,motivoDeshabilitado:'Primero seleccione un servicio.'}));
    assert.match(select,/<select[^>]*disabled=""/);
    assert.match(select,/campo-bloqueo/);
    assert.match(select,/Primero seleccione un servicio/);
    const activo=renderToString(createElement(Button,null,'Guardar'));
    assert.doesNotMatch(activo,/control-ayuda|disabled=""/);
    const ocupado=renderToString(createElement(Button,{cargando:true},'Guardar'));
    assert.match(ocupado,/Espere a que termine la operación/);
  }finally{await vite.close();}
});
