"use strict";(self.webpackChunkgeid_dev_pwa=self.webpackChunkgeid_dev_pwa||[]).push([[369],{21961:function(e,n,i){i.r(n),i.d(n,{default:function(){return Se}});var t=i(29439),r=i(74142),a=i(50228),o=i(86039),s=i(35634),l=i(86078),c=i(62812),d=i(81872),u=i(12710),p=i(97266),h=i(18866),m=i(63109),x=i(75579),g=i(8047),f=i(1413),Z=i(27977),j=i(43788),v=i(24732),b=i(63282),A=i(94162),w=i(1769),k=i(75196),C=i(83423),y=i(72791),B=i(11087),S=i(22444),U=i(5639),E=i(16479),P=i(9872),G=i(45987),L=i(63394),I=i(4780),z=i(90643),M=i(58195),q=i(40464),Q=i(10073),D=i(99749),N=i(35542),R=i(98234),Y=i.n(R),F=(i(89390),i(85100)),O=i(74165),K=i(15861),H=Math.PI/180,T=function(){var e=(0,K.Z)((0,O.Z)().mark((function e(n,i){var t,r,a=arguments;return(0,O.Z)().wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return t=a.length>2&&void 0!==a[2]?a[2]:1,r=a.length>3&&void 0!==a[3]?a[3]:0,e.abrupt("return",new Promise((function(e,a){var o=document.createElement("canvas"),s=o.getContext("2d"),l=n.naturalWidth/n.width,c=n.naturalHeight/n.height,d=window.devicePixelRatio;o.width=Math.floor(i.width*l*d),o.height=Math.floor(i.height*c*d),s.scale(d,d),s.imageSmoothingQuality="high";var u=i.x*l,p=i.y*c,h=r*H,m=n.naturalWidth/2,x=n.naturalHeight/2;s.save(),s.translate(-u,-p),s.translate(m,x),s.rotate(h),s.scale(t,t),s.translate(-m,-x),s.drawImage(n,0,0,n.naturalWidth,n.naturalHeight,0,0,n.naturalWidth,n.naturalHeight),s.restore(),o.toBlob(e,"image/webp")})));case 3:case"end":return e.stop()}}),e)})));return function(n,i){return e.apply(this,arguments)}}(),J=i(74877),X=i(39709),V=i(80184),W=["file"];function _(e){var n=(0,F.ZP)({method:"post"},{manual:!0}),i=(0,t.Z)(n,3),a=i[0].loading,o=i[1],s=i[2],l=(0,y.useState)({message:"",snackbar:!1,error:!1}),c=(0,t.Z)(l,2),d=(c[0],c[1],e.file),u=(0,G.Z)(e,W),p=!!d,h="dark"===(0,r.Z)().palette.mode?"inherit":"primary",m=(0,y.useRef)({targetEl:null,crop:{}});return(0,V.jsx)(y.Fragment,{children:(0,V.jsx)(S.Z,{children:(0,V.jsxs)(M.Z,(0,f.Z)((0,f.Z)({open:p},u),{},{fullWidth:!0,BackdropProps:{sx:{backdropFilter:"blur(15px)"}},children:[(0,V.jsx)(q.Z,{id:"scroll-dialog-title",children:"Editeur profile"}),(0,V.jsx)(Q.Z,{dividers:!0,children:d&&(0,V.jsx)($,{ref:m,src:URL.createObjectURL(d)})}),(0,V.jsxs)(D.Z,{children:[(0,V.jsx)(x.Z,{onClick:function(){s(),m.current={targetEl:null,crop:{}},e.onClose()},size:"small",color:h,children:"annuler"}),(0,V.jsx)(X.Z,{onClick:function(){var n=m.current,i=n.targetEl,t=n.crop;T(i,t).then((function(n){var i=new File([n],(0,J.o)(d.name)+".webp",{type:"image/webp"}),t=new FormData;t.append("file",i),o({data:t}).then(e.onClose)}))},size:"small",variant:"outlined",color:h,loading:a,children:"ajouter"})]})]}))})})}var $=(0,y.forwardRef)((function(e,n){var i=(0,y.useState)(((n||{}).current||{}).crop),r=(0,t.Z)(i,2),o=r[0],s=r[1],l=(0,y.useState)(!1),c=(0,t.Z)(l,2),d=c[0],u=c[1],p=(0,y.useRef)(null);return(0,y.useEffect)((function(){n&&(n.current={crop:o,targetEl:p.current})})),(0,V.jsxs)(a.Z,{sx:{flex:1,display:"flex",minHeight:340},children:[(0,V.jsx)(Y(),{crop:o,onChange:function(e){return s(e)},circularCrop:!0,aspect:1,children:(0,V.jsx)(a.Z,{src:e.src,ref:p,component:"img",alt:e.src.toString(),onLoad:function(){return u(!0)},sx:{display:d?"":"none"}})}),!d&&(0,V.jsx)(N.Z,{sx:{display:"flex",width:"100%",height:350},variant:"rectangular",aniamation:"wave"})]})})),ee=["el"];function ne(e){var n=(0,y.useState)({file:null}),i=(0,t.Z)(n,2),o=i[0],s=i[1],c=e.el,u=(0,G.Z)(e,ee),p=(0,E.kP)(),g=(0,t.Z)(p,2)[1],Z=g.getSession,j=g.cleanSession,v=Z("user")||{},b=v.email,A=v.lastName,w=v.middleName,B=v.firstName,U=Z("user"),P="dark"===(0,r.Z)().palette.mode?"inherit":"primary",M=(0,y.useRef)();return U&&(0,V.jsxs)(y.Fragment,{children:[(0,V.jsx)(L.Z,(0,f.Z)((0,f.Z)({id:"profile",anchorEl:c,keepMounted:!0,open:!!c},u),{},{PaperProps:{elevation:0,sx:{overflow:"visible",backdropFilter:"blur(15px)",bgcolor:function(e){return e.palette.background.paper+"ee"},border:function(e){return"1px solid "+e.palette.divider},m:0,p:0}},transformOrigin:{horizontal:"right",vertical:"top"},anchorOrigin:{horizontal:"right",vertical:"bottom"},children:(0,V.jsx)(a.Z,{sx:{},children:(0,V.jsx)(l.Z,{children:(0,V.jsxs)(S.Z,{children:[(0,V.jsx)(h.Z,{sx:{display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",flex:1},avatar:(0,V.jsx)(I.Z,{overlap:"circular",anchorOrigin:{vertical:"bottom",horizontal:"right"},badgeContent:(0,V.jsx)(a.Z,{sx:{bgcolor:function(e){return e.palette.background.paper+"ee"},borderRadius:25},children:(0,V.jsx)(k.Z,{size:"small",onClick:function(){return M.current.click()},children:(0,V.jsx)(z.Z,{fontSize:"small"})})}),children:(0,V.jsx)(C.Z,{sx:{width:70,height:70,fontSize:25,bgcolor:"primary.main"},"aria-label":"",children:A.charAt(0)})}),title:"".concat(A," ").concat(w?w+" ":"").concat(B),titleTypographyProps:{fontSize:20,variant:"h6",align:"center"},subheader:b,subheaderTypographyProps:{align:"center"}}),(0,V.jsx)(d.Z,{}),(0,V.jsx)(m.Z,{sx:{justifyContent:"center"},children:(0,V.jsx)(x.Z,{color:P,variant:"outlined",size:"small",onClick:function(){return j("user")},children:"deconnexion"})}),(0,V.jsx)(d.Z,{}),(0,V.jsxs)(m.Z,{sx:{mb:0,pb:0},children:[(0,V.jsx)(x.Z,{size:"small",variant:"text",color:P,sx:{flexGrow:1,textTransform:"none",fontSize:12},children:"R\xe9gles de confidentialit\xe9"}),(0,V.jsx)(x.Z,{size:"small",variant:"text",color:P,sx:{flexGrow:1,textTransform:"none",fontSize:12},children:"Conditions d'utilisation"})]})]})})})})),(0,V.jsx)("input",{ref:M,type:"file",hidden:!0,accept:"image/*",onChange:function(n){(0,t.Z)(n.target.files,1)[0]&&s({file:n.target.files[0]}),e.onClose()}}),(0,V.jsx)(_,{file:o.file,onClose:function(){return s((0,f.Z)((0,f.Z)({},o),{},{file:null}))}})]})}var ie=i(8001),te=i(74924),re=i(23072),ae=i(40919),oe=i(40707),se=["el"];function le(e){var n=e.el,i=(0,G.Z)(e,se);return(0,V.jsxs)(L.Z,(0,f.Z)((0,f.Z)({id:"profile",anchorEl:n,keepMounted:!0,open:!!n},i),{},{PaperProps:{elevation:0,sx:{overflow:"visible",backdropFilter:"blur(15px)",bgcolor:function(e){return e.palette.background.paper+"ee"},border:function(e){return"1px solid "+e.palette.divider},m:0,p:0}},children:[(0,V.jsx)(c.Z,{sx:{m:1},variant:"h6",fontSize:18,children:"Applications"}),(0,V.jsx)(a.Z,{sx:{display:"flex",flex:1,width:300,m:1,flexDirection:"row",height:350},component:g.ZP,container:!0,children:ce.sort().map((function(e,n){return(0,V.jsx)(a.Z,{component:g.ZP,item:!0,xs:3,children:(0,V.jsxs)(A.Z,{spacing:.1,children:[(0,V.jsx)(ie.Z,{sx:{display:"flex",justifyContent:"center",alignItems:"center",p:.5},LinkComponent:B.rU,to:e.path,children:(0,V.jsx)(oe.Z,{src:e.icon,size:50})}),(0,V.jsx)(te.Z,{sx:{textAlign:"center",textOverflow:"ellipsis"},children:e.label})]})},n)}))})]}))}var ce=[{label:"Mediath\xe8que",icon:re,path:"/apps/medialibrary"},{label:"Archives",icon:ae,path:"/apps/archives"},{label:"Espace personnel",icon:"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAABmJLR0QA/wD/AP+gvaeTAAADqElEQVRoge1Yu27UQBQ9d2z2wUsCBQQKoqWhXQnxGRTUVPzA0tFTJd9BAQofQE0RJDokPgDEIyBEBMS7XnsuxcxknmadjckSyUeydjw7Oz7nnjNje4EePXr0WCeoq4k+37/9BIwpgMGSoSUYW9eev33cxXVFF5MAgJQ8lcwDyYwlx0CCp11dN+9qoo+/F8sq72LY1XWTEXp17+7kxpULOxsXz2+eybPOYrYKFlXN337+/LS3v/9g8nT3Zfh9RO71vcnk1vWN3cGZ9RIPUS5qfrf3fXLn2e4btz+K0Ma5fCfnkmR5cuTaIAfo6oBeALgZ9Pu4nNOmLOcnRuwouDSgG2FfJEBwTVzVJ8PoiMgSkY8EyKo6GTYdId5G5f9Z/SZEAljKdfBYGbEDfMoFnDYHOnsWWhdOvYDEGuBOJh5tT4FzY3Xyq8Ds0XYn84b4dw4Y8gBwftw87piIHKiZIaj757gufK0Tk0QO7BUd3Yl/Fen2MfC1WER9kQNfDhb4Ma8wzgSGOWEoBIYZYZwJHMWYYrq1MlFmoKgl5jVjLiXmFaOoGWVii48EZASUkjGva8iSwQxIAJKBTACjjDDKBIZCYJQRzuYC41ys9HJdSsZBJTHTRGeVxKyWWNQAkXpyEwQQCIJUu4UAAoEhoX7IAAgMoStzsGD8XtRgVGC22R5nAsNMYJwrUSNBGOcqoUUlMTNkK8asliikBFiRJIckARBCZdvrI4ASEYgfp/VkBIDBWoASwgAEsSZOYMKhiLmUmEuJ/SUvQqayGUi19XlKiOkTemxqy0w6wGAtwDpgyVoxrEuobh2qH9S841D4eUhUNQxpt4iGuBHSQoAi2eQAO2IMaVaDA+KhDIrIm3NbfU2c/L5jOyAASC2GNQXPBUeEpR5Xi5wGwUryBdgoWQG2r4WAwAFdbbHEhVCEERJdkvwokSeIlq6JpQKMtRnivIfrALBOwHXCVWCYBk1TTQoFBfl3xaQQ70KGlP4x6zL6YhQ764KNlsc9QdwXAa/6rqBwoat2iwgRmfgAzAwiGwUrRl35cNfxsu+3gtl9IZQQlowYtY+Q0IQIAJNdsGA+jIcbHzfolnaD34lv3KL6zlBCSAsBJm9u1Y0Y4wyxk3qHfDPtJSICwiHpv83b+O90uF+barPuDAl7oWl6KXLKnVoT7pC2xUgJ+AAg+gsvrIZL0biUItqEMBItCb8PO+KbG+NhamCKgDnMk+JRDm+LbEmegYfthvbo0aNHj5b4A3jUg37/k21NAAAAAElFTkSuQmCC",path:"/apps/workspaces"},{label:"Lisolo na budget",icon:"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAABmJLR0QA/wD/AP+gvaeTAAAC7UlEQVRoge2YTUhUURiGnzPjFGQqGLrJRYGpm2qRLWOEFm6KQBoqKVpputSN0yIYoUI3Gi6inEUQhCIF0s8iJMhdVItymREKKdRk4IiCP/d+LRzB5l7nHu/PqDgvzObMd57zvnO+e+6dCwUVtL+l7AarB5aqjIjRj9AIlHjgLwiMhUJm/Edb2aQHzpayBKgeWKoyioyvQLmP6/xdVeFTP9sPzfjIBCCUPWBEjH78NQ9QHjGNPp+ZgM0OHH+4kMZb29hKDIPFiS9upi6gGEOpeOpx1NKGlh0gAPMAKhx2O7UEoUmZ8uFI27uj2V/aBdiVEigPGWFLG+6ZABk1Zg/stQBl2QN7LYBFhQA7rbwFEMMIhJu3AMZCOhBuXgLImsHKrO+PQQAUBULNSEwTIz3PyuwM5vJyIGtoBRBFYqq9pFsXWtH6/gVCk3tb+nJsoe2aBxAJ30aYc29LXzkDuDEP8Cd57ptZZJwGRoBgrt6Mtmwht+Y3NPfo/Axwxe38ipbxLpAepzrbHfBq3g+lktFeUHGnOksAJXTvtPkN6YSw/VO/27S5nVLJhv886x2jw7WXEDpA6jMjnxDpU83fX/lh0ImfSkZ7K1rGsbsmnI/RoZoeREZBokDx+kc1oEIvZajmnmfzmvxUMtqrlFhaO2cLrf8yMprTgZKL6urka1fmfeDn3gGhw9GFqTodawLkO7SQnNGwUa9RExjf+9OoQjwzPPCdduCzxhI6NYHxHa4B0XgdqFMTHD9ngMw5fD9HxV11bfKNs4ng+Fp3Yhk+cQFTdaI4mxn6CNLnxXw++QUFqZwt1NrVU7YcCV1XSjWCOglSmZn2W2FOCKG3B1bWng32xufdLO4H3zZALDYSPlw31SGoO0Cpg4800H0svPggkUiYOsb95FsCxGIj4eK66adAs46ZDQk8P/irtHlw8Naqk3k/+ZZjtLh2+sl24QAKLq9UppNOdX7zrfcBxY3twjfNvalR4yt/z7/cLaig/a5/UqY7YJwLUKEAAAAASUVORK5CYII=",path:"/apps/livingroom"}],de=i(20303),ue=i(12059),pe=i(13308),he=i(78782),me=[{label:"accueil",path:"/home",icon:de.Z,disabled:!1,accessMode:"private|public"},{label:"mediatheque",path:"/apps/medialibrary",icon:he.Z,disabled:!1,accessMode:"private|public"},{label:"tableau de bord",path:"/apps/dashboard",icon:ue.Z,disabled:!1,accessMode:"private"},{label:"aide",path:"/help",icon:pe.Z,disabled:!0,accessMode:"private|public"}];function xe(){var e=(0,E.kP)(),n=(0,t.Z)(e,2)[1].getSession,i=(0,E.ZR)(),o=(0,t.Z)(i,2)[1],s=(0,y.useState)({tab:0,propfileNav:null,appNav:null}),l=(0,t.Z)(s,2),c=l[0],d=l[1],p=(0,r.Z)(),h=n("user");return(0,V.jsxs)(y.Fragment,{children:[(0,V.jsx)(Z.Z,{sx:{position:"sticky",top:0,backdropFilter:"blur(15px)",bgcolor:function(e){return e.palette.background.paper+"50"}},children:(0,V.jsxs)(j.Z,{children:[(0,V.jsx)(S.Z,{children:(0,V.jsx)(v.Z,{onChange:function(e,n){d((0,f.Z)((0,f.Z)({},c),{},{tab:n}))},value:c.tab,sx:{flexGrow:1},children:me.map((function(e,n){return RegExp(e.accessMode).test(h?"private":"public")&&(0,V.jsx)(b.Z,{label:e.label,value:n,LinkComponent:B.rU,iconPosition:"start",to:e.path,icon:(0,V.jsx)(e.icon,{fontSize:"small"}),disabled:e.disabled},n)}))})}),(0,V.jsxs)(A.Z,{spacing:1,direction:"row",children:[(0,V.jsx)(a.Z,{children:(0,V.jsx)(w.Z,{arrow:!0,title:"Param\xe8tre",enterDelay:700,children:(0,V.jsx)(k.Z,{size:"small",onClick:function(){return o(null).handleChangeProps({settingsNav:!0})},children:(0,V.jsx)(U.Z,{fontSize:"small"})})})}),h?(0,V.jsxs)(y.Fragment,{children:[(0,V.jsx)(a.Z,{children:(0,V.jsx)(w.Z,{arrow:!0,title:"Applications",enterDelay:700,children:(0,V.jsx)(k.Z,{size:"small",onClick:function(e){return d((0,f.Z)((0,f.Z)({},c),{},{appNav:e.target}))},children:(0,V.jsx)(P.Z,{fontSize:"small"})})})}),(0,V.jsx)(a.Z,{children:(0,V.jsx)(w.Z,{arrow:!0,title:"Profil",enterDelay:700,children:(0,V.jsx)(u.Z,{avatar:(0,V.jsx)(C.Z,{}),label:h.lastName,variant:"outlined",component:"button",onClick:function(e){return d((0,f.Z)((0,f.Z)({},c),{},{propfileNav:e.target}))}})})})]}):(0,V.jsx)(a.Z,{children:(0,V.jsx)(x.Z,{variant:"outlined",size:"small",color:"dark"===p.palette.mode?"inherit":"primary",LinkComponent:B.rU,to:"/login",children:"connexion"})})]})]})}),(0,V.jsx)(ne,{onClose:function(){return d((0,f.Z)((0,f.Z)({},c),{},{propfileNav:null}))},el:c.propfileNav}),(0,V.jsx)(le,{onClose:function(){return d((0,f.Z)((0,f.Z)({},c),{},{appNav:null}))},el:c.appNav})]})}var ge=i(41884),fe=i(22580),Ze=function(e){return"string"===typeof e?e.replace(e.charAt(0),e.charAt(0).toUpperCase()):""};function je(e){var n=e.uri,i=e.content,o=e.title,d=e.href,u=e.modeLink,h=e.message,m=e.access,g=e.navigateTo,Z=(0,y.useState)(!1),j=(0,t.Z)(Z,2),v=j[0],b=j[1],A=(0,y.useState)(!1),w=(0,t.Z)(A,2),k=w[0],C=w[1],S="dark"===(0,r.Z)().palette.mode?"inherit":"primary";return(0,V.jsxs)(y.Fragment,{children:[(0,V.jsx)(a.Z,(0,f.Z)((0,f.Z)({},"out"===u?{LinkComponent:"a",href:d}:"in"===u?{LinkComponent:B.rU,to:d}:{}),{},{component:ie.Z,onClick:function(e){m||e.preventDefault(),m||C(!0)},children:(0,V.jsxs)(p.Z,{elevation:5,sx:{height:165,display:"flex",border:function(e){return"1px solid ".concat(e.palette.divider)}},children:[(0,V.jsx)(a.Z,{sx:{display:"flex",flexGrow:1},children:(0,V.jsxs)(l.Z,{children:[(0,V.jsx)(c.Z,{variant:"h6",component:"div",children:Ze(o)}),(0,V.jsx)(c.Z,{variant:"body2",component:"div",color:"text.secondary",children:i})]})}),(0,V.jsx)(s.Z,{image:n,sx:{width:165,display:v?"":"none"},component:"img",onLoad:function(){return b(!0)}}),!v&&(0,V.jsx)(s.Z,{children:(0,V.jsx)(N.Z,{variant:"rectangular",animation:"wave",width:165,height:165})})]})})),(0,V.jsxs)(M.Z,{open:k,onClose:function(){return C(!1)},children:[(0,V.jsx)(Q.Z,{children:(0,V.jsx)(c.Z,{variant:"body2",children:h})}),(0,V.jsxs)(D.Z,{children:[(0,V.jsx)(x.Z,{color:S,children:"annuler",onClick:function(){return C(!1)},size:"small"}),(0,V.jsx)(x.Z,{children:"se connecter",color:S,variant:"outlined",LinkComponent:B.rU,to:g,size:"small"})]})]})]})}var ve=[{uri:i.p+"static/media/carousel_image1.43300c0c03e93260d8e5.jpg",title:"Gain de temps",description:"\n        Geid permet un v\xe9ritable gain de temps via un processus \n        de num\xe9risation qui comprime le volume papier et permet d\u2019acc\xe9der \n        rapidement au document recherch\xe9\n        "},{uri:i.p+"static/media/carousel_image2.31d288780e2b9ae1ea77.jpg",title:"Biblioth\xe8que",description:"\n        La biblioth\xe8que num\xe9rique propose de v\xe9ritables collections de documents budg\xe9taires,\n        aliment\xe9es d'ouvrages \xe0 jour du Minist\xe8re.\n        Le contenu est organis\xe9 pour en faciliter la consultation.\n        "},{uri:i.p+"static/media/carousel_image3.13bdfad02fa762a5d258.jpg",title:"Gestion des documents",description:"\n        Faciliter la recherche ainsi que le partage sans pour autant accro\xeetre \n        la complexit\xe9 de la proc\xe9dure d\u2019acc\xe8s aux documents.\n        "},{uri:i.p+"static/media/carousel_image4.029939098462a8fcaaa4.jpg",title:"Archives",description:"\n        Geid, dans son volet archivage, recueille, classe et conserve le document quel que soit \n        son format (image, vid\xe9o, etc...), en toute s\xe9curit\xe9.\n       "},{uri:i.p+"static/media/carousel_image5.2f2d0d54b119fd5f3db2.jpg",title:"S\xe9curit\xe9",description:"\n        La s\xe9curit\xe9 de l'information demeure un enjeu majeur de garantie de fiabilit\xe9 d'un syst\xe8me.\n        Geid y r\xe9pond.\n        "}],be=i.p+"static/media/archives.69acab0ad9dd762a67b0.jpg",Ae=i.p+"static/media/photo.f71b34995bd4622cfb41.png",we=i.p+"static/media/film.6536c271aa2e8d0813fc.png",ke=[{title:"archives",src:be,accessMode:"private",href:"/app/archives",redirectTo:"/login",content:"\n            Archivage est l\u2019ensemble des techniques et moyens employ\xe9s pour recueillir,\n            classer, conserver et exploiter des documents d\xe8s leur cr\xe9ation",message:"\n            Vous n'\xeates pas connect\xe9 \xe0 Geid pour avoir acc\xe8s aux contenus du service d'archivage.\n            Connectez-vous et r\xe9essayez \xe0 nous pour la visualisation de la section.\n            "},{title:"biblioth\xe8que",src:i.p+"static/media/library.afaca4d2d7a6e71a0d00.jpg",accessMode:"public",href:"/app/medialibrary/books",content:"\n            Collection d\u2019ouvrages susceptibles d\u2019\xe9difier les experts du minist\xe8re sur leur\n            travail quotidien et toute la communaut\xe9 nationale sur la place du Minist\xe8re du\n            Budget"},{title:"filmoth\xe8que",src:we,accessMode:"public",href:"/app/medialibrary/films",content:"\n                Collection des films documentaires professionnels et amateurs relative au\n                domaine du Budget."},{title:"phototh\xe8que",src:Ae,accessMode:"public",href:"/app/medialibrary/pictures",content:"\n            \xa0Collection des figures de proue du Minist\xe8re, des personnalit\xe9s de r\xe9f\xe9rence  dans\n            la production budg\xe9taire et \xe9v\xe8nement m\xe9morial au Minist\xe8re du Budget"},{title:"production & publication",src:i.p+"static/media/product.6a682d71e1079f46d1d4.jpg",accessMode:"public",content:"\n            Production: des bulletins p\xe9riodiques sans oublier le recueil des actes de gestion.\n            Publication: Diffusion, vulgarisation et diss\xe9mination des informations"},{title:"gestion de l'information",src:i.p+"static/media/manager.7604efa77cd2f44c0999.jpg",accessMode:"public",content:"\n            Processus d'organisation, traitement, controle, partage et conservation\n            de l'information sous toute ses formes en vue d'une meilleure prise de\n            d\xe9cision au sein d'une institution."}],Ce=i(11968),ye=i.n(Ce),Be=i(53981);function Se(){var e=(0,r.Z)(),n=(0,E.kP)(),i=(0,(0,t.Z)(n,2)[1].getSession)("user"),f=(0,Be.Z)();return(0,V.jsxs)(a.Z,{children:[(0,V.jsx)(xe,{}),(0,V.jsx)(ye(),{animation:"slide",sx:{mb:1},children:ve.map((function(e,n){return(0,V.jsxs)(o.Z,{sx:{position:"relative"},elevation:0,children:[(0,V.jsx)(s.Z,{component:"img",height:"xs"===f.key?355:200,image:e.uri,sx:{filter:"contrast(150%)"}}),(0,V.jsx)(a.Z,{sx:{position:"absolute",top:0,left:0,width:"70%",height:"100%",color:"white",background:"rgba(0,0,0,0.5)"},children:(0,V.jsxs)(l.Z,{children:[(0,V.jsx)(c.Z,{fontSize:25,children:e.description}),(0,V.jsx)(S.Z,{mode:"dark",children:(0,V.jsx)(d.Z,{textAlign:"right",children:(0,V.jsx)(u.Z,{label:e.title})})})]})})]},n)}))}),(0,V.jsxs)(p.Z,{sx:{mx:1},elevation:0,children:[(0,V.jsx)(h.Z,{title:"GEID",subheader:"Gestion Electronique de l'Information et des Documents",sx:{mb:-3}}),(0,V.jsx)(l.Z,{children:(0,V.jsx)(c.Z,{variant:"body2",color:"text.secondary",children:"La Gestion Electronique de l'Information et des Documents d\xe9signe l'ensemble des techniques et pratiques n\xe9cessaires pour la prise en charge du flux important des donn\xe9es, informations et documents au sein d'une organisation. Cette solution informatique g\xe8re le cycle de vie des fichiers textes, sons, images et vid\xe9os. La GEID offre entre autres avantages : le gain de temps et d\u2019espace consid\xe9rable avec son archivage \xe9lectronique, une biblioth\xe8que virtuelle r\xe9guli\xe8rement \xe0 jour, une filmoth\xe8que et une phototh\xe8que bien fournie."})}),!i&&(0,V.jsx)(m.Z,{children:(0,V.jsx)(x.Z,{variant:"outlined",size:"small",LinkComponent:B.rU,to:"/signup",color:"dark"===e.palette.mode?"inherit":"primary",children:"s'inscrire a geid"})})]}),(0,V.jsx)(a.Z,{children:(0,V.jsx)(g.ZP,{container:!0,spacing:1,sx:{p:1,pb:0},children:Ue.map((function(e,n){return(0,V.jsx)(a.Z,{component:g.ZP,item:!0,xs:f.value({xs:12,md:6,lg:3,xl:2}),children:(0,V.jsx)(ge.Z,{title:Ze(e.title.toLowerCase()),date:"",coverUrl:"/imgs/"+e.image,link:"/documents/"+e.link})},n)}))})}),(0,V.jsx)(a.Z,{children:(0,V.jsx)(g.ZP,{container:!0,spacing:1,sx:{p:1},children:ke.map((function(e,n){return(0,V.jsx)(a.Z,{component:g.ZP,item:!0,xs:f.value({xs:12,md:6,lg:4,xl:4}),children:(0,V.jsx)(je,{title:e.title,content:e.content,href:e.href,modeLink:"in",uri:e.src,access:"private"!==e.accessMode||!!i,navigateTo:e.redirectTo,message:e.message})},n)}))})})]})}var Ue=fe.De}}]);
//# sourceMappingURL=369.4cfc3d39.chunk.js.map