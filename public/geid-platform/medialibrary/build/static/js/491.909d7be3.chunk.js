"use strict";(self.webpackChunkgeid_dev_pwa=self.webpackChunkgeid_dev_pwa||[]).push([[491],{62613:function(e,n,t){t.r(n),t.d(n,{default:function(){return _e}});var i=t(53767),r=t(94721),o=t(1413),a=t(29439),l=t(72791),s=t(68870),c=t(88654),d=t(59434),u=t(25256),f=t(29464),x=t(54333),h=t(97639),p=t(90977),g=t(88860),m=t(57689),v=t(57222),A=t(49507),b=t(43967),Z=t(37121),j=t(79458),w=[{label:"Croper les ent\xeates",icon:v.Z,id:"croped",action:function(){Z.h.dispatch((0,j.I)("croped"))}},{label:"Plein \xe9cran",icon:b.Z,id:"full",action:function(){Z.h.dispatch((0,j.I)("full"))}},{label:"Ecran normal",icon:A.Z,id:"normal",action:function(){Z.h.dispatch((0,j.I)("normal"))}}],y=t(11926),C=t(79847),E=t(36274),I=t(98607),B=[{label:"Ecran",icon:y.Z,options:w,id:"screen",action:function(e){return function(){return Z.h.dispatch((0,j.I)(e))}}},{label:"Quitter",icon:C.Z,id:"quit",action:function(e){if("function"===typeof e)return function(){return e("/home")}}},{label:"Reduire",icon:E.Z,id:"reduis",action:function(){return function(){return Z.h.dispatch((0,I.RD)())}}}],k=t(80184),P=function(){var e=l.useState({anchorEl:null,options:[]}),n=(0,a.Z)(e,2),t=n[0],i=n[1],r=(0,m.s0)(),s=(0,d.v9)((function(e){return e.screen.value})),c=Boolean(t.anchorEl),v="normal"===s?"croped":"croped"===s?"full":"normal";return(0,k.jsxs)(l.Fragment,{children:[(0,k.jsx)(u.Z,{position:"sticky",color:"default",sx:{boxShadow:0},children:(0,k.jsxs)(f.Z,{children:[(0,k.jsx)(x.Z,{sx:{flexGrow:1,ml:1}}),B.map((function(e,n){return(0,k.jsx)(l.Fragment,{children:(0,k.jsx)(h.Z,{title:function(){var n="screen"===e.id?w.find((function(e){return e.id===v})).label:e.label;return n}(),arrow:!0,children:(0,k.jsx)(p.Z,{size:"small",disabled:"screen"===e.id,sx:{ml:1},onClick:e.action?e.action([v,r][n]):function(n){!function(e,n){i({anchorEl:e.currentTarget,options:n})}(n,e.options)},children:function(){var n="screen"===e.id?e.options.find((function(e){return e.id===v})).icon:e.icon;return(0,k.jsx)(n,{fontSize:"small"})}()})})},n)}))]})}),(0,k.jsx)(g.Z,{anchorEl:t.anchorEl,open:c,onClose:function(){return i((0,o.Z)((0,o.Z)({},t),{},{anchorEl:null}))},anchorOrigin:{vertical:"bottom",horizontal:"left"},transformOrigin:{vertical:"top",horizontal:"left"},options:t.options})]})};function N(){return(0,k.jsx)(s.Z,{children:(0,k.jsx)(P,{})})}var z=t(43236),D=t(52411),Q=t(76278),F=t(57064),S=t(49900),q="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAABmJLR0QA/wD/AP+gvaeTAAAFB0lEQVR4nO2a7W9TVRzHP6ftvX1c167duhBE3ARiqiKKhgcjGTIJJEoiDBUx0YQ3+PDCRP8CXxhjNCbqC01wJBpfDIxRMJGgLPEBCD7LlECIEIHNPbV7aLve9rbHF2PVrq3udsPbxvt503Pu+Z3f+Z1ve37nnnsLFhYWFhYWFv9XhNEOnSv2SwCv6iTSEChpf+v4FgHQ8famV6cS6WcB/C0NqF5nsaEUBw8/+GFXFTEvKDazAzAbSwCzAzAbh9EOa29rA8DpcRAIO0sNjk9/tIQjG5LNSQDaA+00uYJFZolMYs1ho4NfA6xfgNEOUkgANC3L+IisaJfL5UY9igeAtDZFfFa7lsvEjI5doLfXQa5lOZuiv1bt4yqGBTj5wwWg8jY4w2h8pG8qke4EGGuJl9sGzxkauKfHTjC6FkEXOfkQSAe9va10dOgGp1CEYQEWiscPjax8ceVKCdDiV/CqxatRwEHv7r2P4Wx9Em9wNV7fRpCRIqN8ZB3wxXziME2Af2PfijsXkfWlSI8JpACvr9RI5rcxTwFqNgnuuPDTEFzNMcnJQhHAZ7exwuNkXaNn73zHqVkBGjMZHdV1CYCcjiubps2tsr7RQ0fQy3KPSkixu6Mnz22fzzimLYHbHa3hG9qbpyvLlkCoOKHm47E1itf7qT/cvCfr9hF2qURnJVJdQjbHDuCDauOo2RwAEAg3vTmaV/bkJWQ1nagX8hKGszr9GZ0BTScnWTafMUwTYIJMJut2T1cmJxB6uqhdTqViwx2rfgwc68uPS2FzIjk9Pkm/LsjIovuPO+g9s5SOmy5WE4dpApzXYxP2vokIVNwGzwHIxPhXyujQPWPpNGOhCDS1lDrT8/cDr1cTR80mwRnGU4mnMmltupKYKG9kk9uq9V/zAvDw5j5UNQGANgV6ttRGsoHPzoSqcV/7AgA43V8XypPj5SwcCH1rNa7rQwCb7ZVCOVlhGUhR1TKoDwF2bT6KomYAmEpCruz5ZwuHvvUYdV0fAgA4Xd8XysnJ0mab8CwKNuwy6rZ+BLC79hXKVwVQhGCxS+Euv5vOJi/XqcrzRt3WjwCPbHwHu5JTVJVgIMDqBhf3hXys8rmIqA4EgqBquzHa84tqxK1pzwTb2q8svXl8cLpS4SzA56f+uiBEPnzku2TM4fTHJQghCt+eRBLL5rmi6bbBEHcDx+Y6n5o+C8zGhu1UXrIJ4A9Nx20TXNZ0+rUs6fzM7bHcyrUUYKGeCU7mMlrWrSrTlfJngdk+BalHG0XjoENLMTwwzKXW68u82xLbgefmOh/TngkOXxwdONs3sQz++SzwdwY3rx9i/8e/M5VcAkxviR7vbLOlHP35FjpvPT2X+dRPEpxBdX5UKCeL7grjSPEuggeI28/O1V1d5QAAHI6XQDwDElLJHFK8j00eYFQcYWc0Y9hdpQb5HovJsnb29a7XZAygwZWebPYPDJT066YL4IX8kPtLVyAGEELr9+X0RNHA/rR0uQkBONyZfpubonbhT6dmfBWRvJe2hu5v2hk63y1f/mTx5ZEM4AK20V1hMgonxG4ul2uq+HpcdtOFoKdSe10h2Sme4EC5pvrLAQuMJYDZAZiNJYDZAZhN5fsAhRNk2Tn7cvK34p3B21Zq818yp3gUTlTqb/hfYvGnKToABN8w7mMhmW88//slYAlgdgBmYwlgdgBmYwlgdgBmYwlgdgAWFhYWFhYWFmbxJ+OAr92+FrZaAAAAAElFTkSuQmCC",R="data:image/png;base64,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",T="data:image/png;base64,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",L=t(40707),V=t(59188),M=t(53981);function X(){var e=(0,d.v9)((function(e){return e.medialibraryNavRight.value.tab})),n=(0,d.I0)(),t=(0,M.Z)(),i=!!["xs","md"].find((function(e){return t.key===e})),r=[{label:"Bibioth\xe8que",icon:q,id:"books"},{label:"Phototh\xe8que",icon:R,id:"images"},{label:"Filmoth\xe8que",icon:T,id:"films"}];return(0,k.jsx)(l.Fragment,{children:(0,k.jsx)(z.Z,{sx:{width:"100%",position:"relative",overflow:"auto",mt:1},disablePadding:!0,children:r.map((function(t,r){return(0,k.jsx)(D.ZP,{sx:{m:0,p:0,fontSize:15},selected:t.id===e,onClick:function(){n((0,V.IE)({tab:t.id})),i&&n((0,I.RD)())},children:(0,k.jsxs)(Q.Z,{children:[(0,k.jsx)(F.Z,{children:(0,k.jsx)(L.Z,{src:t.icon,size:30})}),(0,k.jsx)(S.Z,{primary:"".concat(t.label),primaryTypographyProps:{color:"text.primary"}})]})},"".concat(r))}))})})}function H(){var e=l.useState(!1),n=(0,a.Z)(e,2),t=n[0],i=n[1],r=(0,d.v9)((function(e){return e.medialibraryNavLeft.value.open})),u=(0,M.Z)(),f=!!["xs","md"].find((function(e){return u.key===e}));return l.useEffect((function(){r&&i(!0)}),[r,i]),(0,k.jsx)(s.Z,(0,o.Z)((0,o.Z)({},f?{component:c.ZP,open:r}:{sx:{display:"flex",flexDirection:"column",width:r?360:0,transition:function(e){return e.transitions.create("width",{easing:e.transitions.easing.sharp,duration:e.transitions.duration.leavingScreen})},overflow:"hidden",bgcolor:"background.paper"},onTransitionEnd:function(){r||i(!1)}}),{},{children:t&&(0,k.jsxs)(s.Z,{sx:{transition:function(e){return e.transitions.create("left",{easing:e.transitions.easing.sharp,duration:e.transitions.duration.leavingScreen})},position:"relative",left:-r?0:-360,display:"flex",flex:1,flexDirection:"column"},children:[(0,k.jsx)(N,{}),(0,k.jsx)(X,{})]})}))}var G=t(4567),O=t(81153),U=t(24891),Y=t(98912),K=t(66831);function J(){var e=(0,d.v9)((function(e){return e.medialibraryNavRight.value.data.books})),n=(0,d.v9)((function(e){return e.medialibraryNavLeft.value.open})),t=(0,d.v9)((function(e){return e.medialibraryNavRight.value.bookLibrary.selectedBookType})),i=null===e||void 0===e?void 0:e.filter((function(e){var n=e.type;return!t||n===t}));return(0,k.jsx)(s.Z,{sx:{display:"flex",flex:1,px:1,mb:1},children:0===i.length?(0,k.jsx)(U.Z,{display:"flex",flex:1,justifyContent:"center",alignItems:"center",children:(0,k.jsx)(G.Z,{variant:"caption",color:"text.secondary",children:"Aucun \xe9lement trouv\xe9"})}):(0,k.jsx)(s.Z,{children:(0,k.jsx)(O.ZP,{container:!0,spacing:1,sx:{pb:0},children:i.map((function(e,t){return(0,k.jsx)(O.ZP,{item:!0,xs:12,md:6,lg:n?4:3,xl:n?3:2,children:(0,k.jsx)(Y.Z,{coverUrl:e.coverUrl,title:e.title,date:(0,K.Z)(e.createdAt),link:e.contentUrl},t)},t)}))})})})}var W=t(93433),_=t(58662);function $(){var e=(0,d.I0)(),n=(0,d.v9)((function(e){return e.medialibraryNavRight.value.bookLibrary.bookTypes})),t=(0,d.v9)((function(e){return e.medialibraryNavRight.value.bookLibrary.selectedBookType})),o=[{label:"TOUS",value:null}].concat((0,W.Z)((null===n||void 0===n?void 0:n.map((function(e){return{label:e,value:e}})))||[])),a=o.findIndex((function(e){return e.value===t}));return(0,k.jsxs)(s.Z,{sx:{m:1,mt:0,bgcolor:"background.paper",top:0,position:"sticky",zIndex:function(e){return e.zIndex.appBar-1}},children:[(0,k.jsx)(i.Z,{mt:1,children:(0,k.jsx)(_.Z,{options:o,indicator:!1,onChange:function(n,t){var i=t.value;e((0,V.Tg)({type:i||null}))},defaultIndex:a})}),(0,k.jsx)(r.Z,{})]})}function ee(){return(0,k.jsxs)(l.Fragment,{children:[(0,k.jsx)($,{}),(0,k.jsx)(J,{})]})}var ne=t(81374),te=t(1867),ie=t(85771),re=t(9057);function oe(e){var n=e.src,t=e.title,i=e.description,r=l.useState(null),o=(0,a.Z)(r,2),c=o[0],d=o[1];return(0,k.jsxs)(s.Z,{children:[(0,k.jsxs)(s.Z,{sx:{position:"relative",m:0,p:0},children:[(0,k.jsx)(ne.Z,{href:n,target:"_blank",children:(0,k.jsx)(te.Z,{component:"video",src:n,onLoadedMetadata:function(e){var n=function(e){var n=Math.floor(e/2592e3),t=Math.floor(30*(e/2592e3-n)),i=Math.floor(24*(30*(e/2592e3-n)-t)),r=Math.floor(60*(24*(30*(e/2592e3-n)-t)-i)),o=Math.floor(60*(60*(24*(30*(e/2592e3-n)-t)-i)-r));return"".concat(n?n+"m":""," ").concat(t?t+"j":""," ").concat(i?i+":":"").concat(r.toString().padStart(2,"0"),":").concat(o.toString().padStart(2,"0")).trim()}(e.target.duration);d({duration:n})}})}),c&&(0,k.jsx)(l.Fragment,{children:(0,k.jsx)(ie.Z,{label:c.duration,sx:{position:"absolute",bottom:"5px",right:"5px",bgcolor:"primary.main",color:"white"}})})]}),(0,k.jsx)(s.Z,{sx:{mx:1,my:0},children:(0,k.jsx)(re.Z,{title:(0,k.jsx)(G.Z,{variant:"h6",fontSize:15,color:"text.primary",children:t}),subtitle:c&&(0,k.jsx)(G.Z,{color:"text.secondary",variant:"caption",children:i}),position:"below",sx:{maxWidth:{xs:300,md:400},whiteSpace:"nowrap",overflow:"hiddenn",textOverflow:"ellipsis"}})})]})}function ae(){var e=(0,d.v9)((function(e){return e.medialibraryNavRight.value.data.films})),n=(0,d.v9)((function(e){return e.medialibraryNavLeft.value.open}));return(0,k.jsx)(s.Z,{sx:{display:"flex",flex:1,px:1,mt:1},children:(0,k.jsx)(s.Z,{children:(0,k.jsx)(O.ZP,{container:!0,spacing:1,sx:{pb:0},children:null===e||void 0===e?void 0:e.map((function(e,t){return(0,k.jsx)(O.ZP,{item:!0,xs:12,md:6,lg:n?4:3,xl:n?3:2,children:(0,k.jsx)(oe,{src:e.contentUrl,title:e.title,description:e.description})},t)}))})})})}function le(){return(0,k.jsx)(l.Fragment,{children:(0,k.jsx)(ae,{})})}var se=t(11968),ce=t.n(se),de=t(4942),ue=t(66934),fe=t(2863),xe=(0,ue.ZP)(fe.Z)((function(e){var n,t=e.theme;return n={position:"relative",height:200},(0,de.Z)(n,t.breakpoints.down("sm"),{width:"100% !important",height:100}),(0,de.Z)(n,"&:hover, &.Mui-focusVisible",{zIndex:1,"& .MuiImageBackdrop-root":{opacity:.15},"& .MuiImageMarked-root":{opacity:0}}),n})),he=(0,ue.ZP)("span")({position:"absolute",left:0,right:0,top:0,bottom:0,backgroundSize:"cover",backgroundPosition:"center 40%"}),pe=(0,ue.ZP)("span")((function(e){return{position:"absolute",left:0,right:0,top:0,bottom:0,display:"flex",alignItems:"center",justifyContent:"center",color:e.theme.palette.common.white}})),ge=(0,ue.ZP)("span")((function(e){var n=e.theme;return{position:"absolute",left:0,right:0,top:0,bottom:0,backgroundColor:n.palette.common.black,opacity:.4,transition:n.transitions.create("opacity")}})),me=(0,ue.ZP)("span")((function(e){var n=e.theme;return{height:3,width:18,backgroundColor:n.palette.common.white,position:"absolute",bottom:-2,left:"calc(50% - 9px)",transition:n.transitions.create("opacity")}}));function ve(e){var n=e.items;return(0,k.jsx)(s.Z,{sx:{display:"flex",flexWrap:"wrap",width:"100%"},children:n.map((function(e,n){return(0,k.jsxs)(xe,{focusRipple:!0,style:{width:"".concat(100/3,"%")},children:[(0,k.jsx)(he,{style:{backgroundImage:"url(".concat(null===e||void 0===e?void 0:e.src,")")}}),(0,k.jsx)(ge,{className:"MuiImageBackdrop-root"}),(0,k.jsx)(pe,{sx:{bgcolor:function(n){return"message"===(null===e||void 0===e?void 0:e.type)?n.palette.primary.main:"none"}},children:"message"===(null===e||void 0===e?void 0:e.type)?(0,k.jsxs)(i.Z,{children:[(0,k.jsx)(G.Z,{component:"div",variant:"h4",color:"inherit",sx:{},children:e.title}),(0,k.jsxs)(G.Z,{component:"span",variant:"body2",color:"inherit",sx:{position:"relative",p:2,pb:function(e){return"calc(".concat(e.spacing(1)," + 6px)")}},children:[e.content,(0,k.jsx)(me,{className:"MuiImageMarked-root"})]})]}):(0,k.jsx)(re.Z,{title:null===e||void 0===e?void 0:e.label,position:"bottom"})})]},n)}))})}var Ae=t.p+"static/media/iStock-949118068-1.e112871bc38db5a55826.jpg",be=t.p+"static/media/geidbooklibrary.5afd37a344a19365efee.png",Ze=t.p+"static/media/geidphotolib.7ca649508ebfa2043c73.png",je=[{title:"Biblioth\xe8que",content:"Voir la  Collection d\u2019ouvrages du Minist\xe8re",items:[{label:"Collection de livres",src:Ae},{label:"Biblioth\xe8que numerique avce Geid",src:be}]},{title:"Phototh\xe8que",content:"\n        Visualiser les personnalit\xe9s de r\xe9f\xe9rence et \xe9v\xe8nement m\xe9morial au Minist\xe8re du Budget",items:[{label:"Lancement du SIGMAP par Le chef de l'\xc9tat, une innovation sign\xe9e Aim\xe9 Boji Sangara",src:t.p+"static/media/IMG-20220829-WA0143.377b7ebc01f23f973b0c.jpg"},{label:"Geid Phototh\xe8que",src:Ze}]},{title:"Filmoth\xe8que",content:"\n        Profiter d'un ensemble de\n        documentaires professionnels et amateurs relative au\n        domaine du Budget.",items:[{label:"Une d\xe9l\xe9gation des ministres d\xe9j\xe0 a Goma.",src:t.p+"static/media/20221007_103726.be7edec197fcb2da03f2.gif"},{label:"F\xe9lix Tshisekedi, Conf\xe9rence sur les lois",src:t.p+"static/media/20221007_110306.9719353d2abe67c86ef4.gif"}]}];function we(e){return(0,k.jsx)(s.Z,{children:(0,k.jsx)(ce(),{interval:6e3,duration:1e3,children:je.map((function(e,n){var t={content:e.content,title:e.title,type:"message"};return(0,k.jsx)(ve,{items:0===n&&[t].concat((0,W.Z)(e.items))||1===n&&[e.items[0],t,e.items[1]]||2===n&&[].concat((0,W.Z)(e.items),[t]),contentPosition:e.contentPosition},n)}))})})}var ye=t(88588),Ce=t(22492),Ee=t(77234),Ie=t(5849),Be=t(72241),ke=t(86263),Pe=[{title:"Biblioth\xe8que",icon:q,content:ke.Z[1].content,id:"books"},{title:"Phototh\xe8que",icon:R,content:ke.Z[3].content,id:"images"},{title:"Filmoth\xe8que",icon:T,content:ke.Z[2].content,id:"films"}],Ne=t(22444);function ze(){var e=(0,d.I0)();return(0,k.jsx)(s.Z,{sx:{m:1,mt:5},children:(0,k.jsx)(O.ZP,{container:!0,spacing:1,children:Pe.map((function(n,t){return(0,k.jsx)(O.ZP,{item:!0,xs:12,md:6,lg:4,xl:4,sx:{display:"flex",flex:1},children:(0,k.jsx)(ye.Z,{elevation:5,sx:{border:function(e){return"1x solid ".concat(e.palette.divider)}},children:(0,k.jsxs)(i.Z,{direction:"row",display:"flex",height:"100%",children:[(0,k.jsx)(s.Z,{sx:{display:"flex",justifyContent:"center",alignItems:"center",mx:1},children:(0,k.jsx)(L.Z,{src:n.icon,size:50})}),(0,k.jsxs)(s.Z,{sx:{height:"100%"},children:[(0,k.jsxs)(Ce.Z,{sx:{height:"calc(100% - 80px)"},children:[(0,k.jsx)(G.Z,{gutterBottom:!0,variant:"h6",component:"div",children:n.title}),(0,k.jsx)(G.Z,{color:"text.secondary",variant:"body2",children:n.content})]}),(0,k.jsx)(r.Z,{variant:"middle"}),(0,k.jsx)(Ee.Z,{children:(0,k.jsx)(Ne.Z,{children:(0,k.jsxs)(Ie.Z,{size:"small",sx:{textTransform:"none"},endIcon:(0,k.jsx)(Be.Z,{}),onClick:function(){return e((0,V.IE)({tab:n.id}))},children:["Acc\xe9der \xe0 la ",n.title.toLocaleLowerCase()]})})})]})]})})},t)}))})})}function De(){return(0,k.jsxs)(s.Z,{sx:{width:"100%",diaplay:"flex",flex:1},children:[(0,k.jsx)(we,{}),(0,k.jsx)(ze,{})]})}var Qe=t(94751),Fe=t(32163);function Se(){var e=(0,d.v9)((function(e){return e.medialibraryNavRight.value.data.images})),n=(0,d.v9)((function(e){return e.medialibraryNavRight.value.photoLibrary.selectedImage})),t=(0,d.v9)((function(e){return e.medialibraryNavLeft.value.open})),i=(0,d.I0)(),r=(0,M.Z)(),a=!!["xs","md"].find((function(e){return r.key===e}));return(0,k.jsx)(s.Z,{sx:{display:"flex",flex:1,overflow:"hidden"},children:(0,k.jsx)(Qe.Z,{sx:{transform:"translateZ(0)",m:0,p:1,overflow:"auto"},rowHeight:200,cols:a?2:t?n?3:4:n?4:6,gap:1,children:e.map((function(e,t){return(0,k.jsx)(ne.Z,{onClick:function(){return i((0,V.jG)({image:e}))},children:(0,k.jsxs)(Fe.Z,{cols:1,rows:1,sx:(0,o.Z)({},(null===n||void 0===n?void 0:n._id)===e._id?{opacity:.6}:{}),children:[(0,k.jsx)("img",(0,o.Z)((0,o.Z)({},(r=e.contentUrl,{src:"".concat(r),srcSet:"".concat(r)})),{},{alt:e.title,loading:"lazy"})),(0,k.jsx)(re.Z,{sx:{background:"linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0) 100%)"},title:e.title,position:"top"})]},t)},t);var r}))})})}var qe=t(18060),Re=t(49905),Te=t(84080),Le=t(84314);function Ve(){var e=(0,d.v9)((function(e){return e.medialibraryNavRight.value.photoLibrary.selectedImage})),n=l.useState(!!e),t=(0,a.Z)(n,2),i=t[0],r=t[1],x=((0,d.v9)((function(e){return e.medialibraryNavRight.value.data.images})),(0,d.I0)()),h=l.useState(!1),g=(0,a.Z)(h,2),m=g[0],v=g[1],A=(0,M.Z)(),b=!!["xs","md"].find((function(e){return A.key===e})),Z=[{title:"Fermer",icon:Re.Z,action:function(){r(!1)}},{title:m?"Reduire":"Agrandir",icon:m?Te.Z:Le.Z,action:function(){v(!m)},fullScreen:m}];return l.useEffect((function(){e&&r(!0)}),[e,r]),(0,k.jsx)(s.Z,(0,o.Z)((0,o.Z)({},m?{component:qe.Z,open:i,zIndex:function(e){return e.zIndex.drawer+1},sx:{bgcolor:function(e){return e.palette.background.paper+"dd"},flexDirection:"column",backdropFilter:"blur(15px)","& > div":{alignItems:"center",width:window.innerWidth}}}:(0,o.Z)((0,o.Z)({},b?{component:c.ZP,variant:"persistent",open:i}:{component:"div",sx:{display:"flex",flex:i?.5:0,bgcolor:"background.paper",overflow:"hidden",transition:function(e){return e.transitions.create("flex",{easing:e.transitions.easing.sharp,duration:e.transitions.duration.leavingScreen})},position:"relative"}}),{},{onTransitionEnd:function(){i||x((0,V.jG)({image:null}))}})),{},{children:(0,k.jsxs)(U.Z,{display:"flex",flex:1,component:"div",overflow:"auto",position:"relative",children:[(0,k.jsx)(s.Z,{component:u.Z,sx:(0,o.Z)({top:0,p:0,m:0,display:"flex",position:"absolute",zIndex:1e3,boxShadow:0,bgcolor:"transparent"},m?{}:{background:"linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0) 100%)"}),children:(0,k.jsx)(f.Z,{sx:{p:0,m:0,mt:m?0:-1},children:Z.map((function(e,n){return n?(!m||e.fullScreen)&&(0,k.jsx)(p.Z,{onClick:e.action,disabled:e.disabled,size:"small",color:m?"default":"inherit",children:(0,k.jsx)(e.icon,{fontSize:"small"})},n):(!m||e.fullScreen)&&(0,k.jsx)(s.Z,{sx:{flexGrow:1},children:(0,k.jsx)(p.Z,{onClick:e.action,disabled:e.disabled,size:"small",color:m?"default":"inherit",children:(0,k.jsx)(e.icon,{fontSize:"small"})})},n)}))})}),(0,k.jsx)(s.Z,{sx:(0,o.Z)({display:"flex",justifyContent:"center",alignItems:"center"},m?{flex:1}:{}),children:(0,k.jsx)(te.Z,{src:null===e||void 0===e?void 0:e.contentUrl,component:"img",srcSet:null===e||void 0===e?void 0:e.contentUrl,sx:(0,o.Z)({},m?{height:400}:{})})}),(0,k.jsxs)(s.Z,{sx:{mb:3,mx:1,textOverflow:"ellipsis",overflow:"hidden"},children:[(0,k.jsx)(G.Z,{color:"text.primary",mt:1,variant:"body1",children:null===e||void 0===e?void 0:e.title}),(0,k.jsx)(G.Z,{color:"text.secondary",variant:"caption",children:null===e||void 0===e?void 0:e.title})]})]})}))}function Me(){return(0,k.jsx)(l.Fragment,{children:(0,k.jsxs)(U.Z,{display:"flex",flex:1,direction:"row",height:"100%",children:[(0,k.jsx)(Se,{}),(0,k.jsx)(Ve,{})]})})}function Xe(){var e=(0,d.v9)((function(e){return e.medialibraryNavRight.value.tab}));return(0,k.jsxs)(s.Z,{sx:{display:"flex",flex:1,overflow:"auto",flexDirection:"column",height:"100%"},children:["home"===e&&(0,k.jsx)(De,{}),"books"===e&&(0,k.jsx)(ee,{}),"images"===e&&(0,k.jsx)(Me,{}),"films"===e&&(0,k.jsx)(le,{})]})}var He=t(78709),Ge=t(97781),Oe=(t(16479),function(){var e=(0,d.I0)();return!(0,d.v9)((function(e){return e.medialibraryNavLeft.value.open}))&&(0,k.jsx)(p.Z,{size:"small",edge:"start",onClick:function(){return e((0,I.tm)())},sx:{mr:1},children:(0,k.jsx)(He.Z,{})})}),Ue=function(){var e=l.useState(!1),n=(0,a.Z)(e,2),t=n[0],i=n[1],r=l.useRef(),o=(0,m.s0)(),s=[{label:"Quitter",icon:C.Z,id:"quit",action:function(){o("/home")}}];return(0,k.jsxs)(l.Fragment,{children:[(0,k.jsx)(h.Z,{arrow:!0,title:"Plus",enterDelay:700,children:(0,k.jsx)(p.Z,{size:"small",onClick:function(){i(!0)},ref:r,children:(0,k.jsx)(Ge.Z,{fontSize:"small"})})}),(0,k.jsx)(g.Z,{options:s,open:t,anchorEl:r.current,onClose:function(){i(!1)}})]})};function Ye(){return(0,k.jsx)(l.Fragment,{children:(0,k.jsx)(u.Z,{position:"sticky",color:"default",children:(0,k.jsxs)(f.Z,{children:[(0,k.jsx)(Oe,{}),(0,k.jsx)(G.Z,{sx:{flexGrow:1},children:"Mediath\xe8que"}),(0,k.jsx)(Ue,{})]})})})}function Ke(){return(0,k.jsxs)(s.Z,{sx:{display:"flex",flex:1,flexDirection:"column",height:"100%"},children:[(0,k.jsx)(Ye,{}),(0,k.jsx)(Xe,{})]})}var Je=t(98246),We=t(71669);function _e(){var e=(0,d.v9)((function(e){return e.medialibraryNavRight.value.open}));return(0,k.jsxs)(l.Fragment,{children:[e&&(0,k.jsx)(Je.wT,{maxSnack:1,children:(0,k.jsxs)(i.Z,{height:"100vh",display:"flex",direction:"row",overflow:"hidden",divider:(0,k.jsx)(r.Z,{orientation:"vertical",flexItem:!0}),bgcolor:"background.default",children:[(0,k.jsx)(H,{}),(0,k.jsx)(Ke,{})]})}),(0,k.jsx)(We.Z,{loadData:!0})]})}},86263:function(e,n,t){t.d(n,{Z:function(){return a}});var i=t.p+"static/media/archives.69acab0ad9dd762a67b0.jpg",r=t.p+"static/media/photo.f71b34995bd4622cfb41.png",o=t.p+"static/media/film.6536c271aa2e8d0813fc.png",a=[{title:"archives",src:i,accessMode:"private",href:"/app/archives",redirectTo:"/login",content:"\n            Archivage est l\u2019ensemble des techniques et moyens employ\xe9s pour recueillir,\n            classer, conserver et exploiter des documents d\xe8s leur cr\xe9ation",message:"\n            Vous n'\xeates pas connect\xe9 \xe0 Geid pour avoir acc\xe8s aux contenus du service d'archivage.\n            Connectez-vous et r\xe9essayez \xe0 nous pour la visualisation de la section.\n            "},{title:"biblioth\xe8que",src:t.p+"static/media/library.afaca4d2d7a6e71a0d00.jpg",accessMode:"public",href:"/app/medialibrary/books",content:"\n            Collection d\u2019ouvrages susceptibles d\u2019\xe9difier les experts du minist\xe8re sur leur\n            travail quotidien et toute la communaut\xe9 nationale sur la place du Minist\xe8re du\n            Budget"},{title:"filmoth\xe8que",src:o,accessMode:"public",href:"/app/medialibrary/films",content:"\n                Collection des films documentaires professionnels et amateurs relative au\n                domaine du Budget."},{title:"phototh\xe8que",src:r,accessMode:"public",href:"/app/medialibrary/pictures",content:"\n            \xa0Collection des figures de proue du Minist\xe8re, des personnalit\xe9s de r\xe9f\xe9rence  dans\n            la production budg\xe9taire et \xe9v\xe8nement m\xe9morial au Minist\xe8re du Budget"},{title:"production & publication",src:t.p+"static/media/product.6a682d71e1079f46d1d4.jpg",accessMode:"public",content:"\n            Production: des bulletins p\xe9riodiques sans oublier le recueil des actes de gestion.\n            Publication: Diffusion, vulgarisation et diss\xe9mination des informations"},{title:"gestion de l'information",src:t.p+"static/media/manager.7604efa77cd2f44c0999.jpg",accessMode:"public",content:"\n            Processus d'organisation, traitement, controle, partage et conservation\n            de l'information sous toute ses formes en vue d'une meilleure prise de\n            d\xe9cision au sein d'une institution."}]},72241:function(e,n,t){var i=t(64836);n.Z=void 0;var r=i(t(45649)),o=t(80184),a=(0,r.default)((0,o.jsx)("path",{d:"M9.29 6.71c-.39.39-.39 1.02 0 1.41L13.17 12l-3.88 3.88c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0l4.59-4.59c.39-.39.39-1.02 0-1.41L10.7 6.7c-.38-.38-1.02-.38-1.41.01z"}),"ChevronRightRounded");n.Z=a},84080:function(e,n,t){var i=t(64836);n.Z=void 0;var r=i(t(45649)),o=t(80184),a=(0,r.default)((0,o.jsx)("path",{d:"M21.29 4.12 16.7 8.71l1.59 1.59c.63.63.18 1.71-.71 1.71H13c-.55 0-1-.45-1-1v-4.6c0-.89 1.08-1.34 1.71-.71l1.59 1.59 4.59-4.59c.39-.39 1.02-.39 1.41 0 .38.4.38 1.03-.01 1.42zM4.12 21.29l4.59-4.59 1.59 1.59c.63.63 1.71.18 1.71-.71V13c0-.55-.45-1-1-1h-4.6c-.89 0-1.34 1.08-.71 1.71l1.59 1.59-4.59 4.59c-.39.39-.39 1.02 0 1.41.4.38 1.03.38 1.42-.01z"}),"CloseFullscreenRounded");n.Z=a},84314:function(e,n,t){var i=t(64836);n.Z=void 0;var r=i(t(45649)),o=t(80184),a=(0,r.default)((0,o.jsx)("path",{d:"M21 8.59V4c0-.55-.45-1-1-1h-4.59c-.89 0-1.34 1.08-.71 1.71l1.59 1.59-10 10-1.59-1.59c-.62-.63-1.7-.19-1.7.7V20c0 .55.45 1 1 1h4.59c.89 0 1.34-1.08.71-1.71L7.71 17.7l10-10 1.59 1.59c.62.63 1.7.19 1.7-.7z"}),"OpenInFullRounded");n.Z=a}}]);
//# sourceMappingURL=491.909d7be3.chunk.js.map