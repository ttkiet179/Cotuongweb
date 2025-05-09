// === MENU FUNCTIONS ===
function viewHistory() {
  alert("Xem lịch sử các ván cờ!");
}
function openSettings() {
  alert("Mở cài đặt trò chơi!");
}

// === INITIAL SETUP ===
const initialPositions = [
  // Đen
  { type: 'chariot', color: 'black', x: 0, y: 0 },
  { type: 'horse',   color: 'black', x: 1, y: 0 },
  { type: 'elephant',color: 'black', x: 2, y: 0 },
  { type: 'advisor', color: 'black', x: 3, y: 0 },
  { type: 'general', color: 'black', x: 4, y: 0 },
  { type: 'advisor', color: 'black', x: 5, y: 0 },
  { type: 'elephant',color: 'black', x: 6, y: 0 },
  { type: 'horse',   color: 'black', x: 7, y: 0 },
  { type: 'chariot', color: 'black', x: 8, y: 0 },
  { type: 'cannon',  color: 'black', x: 1, y: 2 },
  { type: 'cannon',  color: 'black', x: 7, y: 2 },
  { type: 'soldier', color: 'black', x: 0, y: 3 },
  { type: 'soldier', color: 'black', x: 2, y: 3 },
  { type: 'soldier', color: 'black', x: 4, y: 3 },
  { type: 'soldier', color: 'black', x: 6, y: 3 },
  { type: 'soldier', color: 'black', x: 8, y: 3 },
  // Đỏ
  { type: 'chariot', color: 'red', x: 0, y: 9 },
  { type: 'horse',   color: 'red', x: 1, y: 9 },
  { type: 'elephant',color: 'red', x: 2, y: 9 },
  { type: 'advisor', color: 'red', x: 3, y: 9 },
  { type: 'general', color: 'red', x: 4, y: 9 },
  { type: 'advisor', color: 'red', x: 5, y: 9 },
  { type: 'elephant',color: 'red', x: 6, y: 9 },
  { type: 'horse',   color: 'red', x: 7, y: 9 },
  { type: 'chariot', color: 'red', x: 8, y: 9 },
  { type: 'cannon',  color: 'red', x: 1, y: 7 },
  { type: 'cannon',  color: 'red', x: 7, y: 7 },
  { type: 'soldier', color: 'red', x: 0, y: 6 },
  { type: 'soldier', color: 'red', x: 2, y: 6 },
  { type: 'soldier', color: 'red', x: 4, y: 6 },
  { type: 'soldier', color: 'red', x: 6, y: 6 },
  { type: 'soldier', color: 'red', x: 8, y: 6 },
];

let boardState = [];
let turn = 'red';
let selected = null;
let highlights = [];
let historyStack = [];

function initBoard() {
  boardState = Array.from({ length: 10 }, () => Array(9).fill(null));
  initialPositions.forEach(p => {
    boardState[p.y][p.x] = { ...p };
  });
}

function startNewGame() {
  document.getElementById('menu').style.display = 'none';
  document.getElementById('game-board').style.display = 'block';
  initBoard();
  renderPieces();
  localStorage.setItem('inGame','true');
}

function returnToMenu() {
  localStorage.removeItem('inGame');
  document.getElementById('game-board').style.display = 'none';
  document.getElementById('menu').style.display = 'block';
}

// === RENDER & INTERACTION ===
function renderPieces() {
  const container = document.getElementById('pieces-container');
  container.innerHTML = '';
  const cellW = 60, cellH = 60, offX = 30, offY = 30;

  boardState.forEach((row,y) => row.forEach((cell,x) => {
    if (!cell) return;
    const img = document.createElement('img');
    img.src = `assets/pieces/${cell.color}/${cell.type}.png`;
    img.className = 'piece';
    img.style.left = `${offX + x*cellW}px`;
    img.style.top  = `${offY + y*cellH}px`;
    img.dataset.x = x; img.dataset.y = y;
    img.dataset.color = cell.color; img.dataset.type = cell.type;
    img.addEventListener('click', onPieceClick);
    container.appendChild(img);
  }));
  renderHighlights();
}

function onPieceClick(e) {
  const x = +e.target.dataset.x, y = +e.target.dataset.y;
  if (!boardState[y][x] || boardState[y][x].color !== turn) return;
  clearHighlights();
  selected = { x,y, piece: boardState[y][x] };
  highlights = getLegalMoves(x,y,selected.piece);
  renderHighlights();
}

function getLegalMoves(x,y,piece) {
  const moves = [];
  const dirs = { up:[0,-1], down:[0,1], left:[-1,0], right:[1,0] };
  const inB = (x,y) => x>=0&&x<9&&y>=0&&y<10;
  const ally = (x,y) => inB(x,y)&&boardState[y][x]&&boardState[y][x].color===piece.color;
  const enemy= (x,y) => inB(x,y)&&boardState[y][x]&&boardState[y][x].color!==piece.color;

  switch(piece.type) {
    case 'chariot':
      ['up','down','left','right'].forEach(d=>{
        let [dx,dy]=dirs[d], nx=x+dx, ny=y+dy;
        while(inB(nx,ny)){
          if (!boardState[ny][nx]) moves.push({x:nx,y:ny});
          else { if(enemy(nx,ny)) moves.push({x:nx,y:ny}); break; }
          nx+=dx; ny+=dy;
        }
      }); break;

    case 'horse':
      [[2,1],[2,-1],[-2,1],[-2,-1],[1,2],[1,-2],[-1,2],[-1,-2]].forEach(([dx,dy])=>{
        const bx=x+(Math.abs(dx)===2?dx/2:0), by=y+(Math.abs(dy)===2?dy/2:0);
        if(inB(x+dx,y+dy)&& !boardState[by][bx] && !ally(x+dx,y+dy))
          moves.push({x:x+dx,y:y+dy});
      }); break;

    case 'elephant':
      [[2,2],[2,-2],[-2,2],[-2,-2]].forEach(([dx,dy])=>{
        const mx=x+dx/2, my=y+dy/2, nx=x+dx, ny=y+dy;
        const ok = piece.color==='red'? ny>=5: ny<=4;
        if(inB(nx,ny)&&ok&&!boardState[my][mx]&&!ally(nx,ny))
          moves.push({x:nx,y:ny});
      }); break;

    case 'advisor':
      [[1,1],[1,-1],[-1,1],[-1,-1]].forEach(([dx,dy])=>{
        const nx=x+dx, ny=y+dy;
        const inPal = nx>=3&&nx<=5&&((piece.color==='red'&&ny>=7)||(piece.color==='black'&&ny<=2));
        if(inPal&&!ally(nx,ny)) moves.push({x:nx,y:ny});
      }); break;

    case 'general':
      ['up','down','left','right'].forEach(d=>{
        const [dx,dy]=dirs[d], nx=x+dx, ny=y+dy;
        const inPal = nx>=3&&nx<=5&&((piece.color==='red'&&ny>=7)||(piece.color==='black'&&ny<=2));
        if(inPal&&!ally(nx,ny)) moves.push({x:nx,y:ny});
      }); break;

    case 'cannon':
      ['up','down','left','right'].forEach(d=>{
        let [dx,dy]=dirs[d], nx=x+dx, ny=y+dy;
        while(inB(nx,ny)&&!boardState[ny][nx]){ moves.push({x:nx,y:ny}); nx+=dx; ny+=dy; }
        if(inB(nx,ny)){
          let jx=nx+dx, jy=ny+dy;
          while(inB(jx,jy)){
            if(boardState[jy][jx]){ if(enemy(jx,jy)) moves.push({x:jx,y:jy}); break; }
            jx+=dx; jy+=dy;
          }
        }
      }); break;

    case 'soldier':
      const fwd = piece.color==='red'? -1:1;
      if(inB(x,y+fwd)&&!ally(x,y+fwd)) moves.push({x,y:y+fwd});
      const cross = piece.color==='red'? y<=4: y>=5;
      if(cross) ['left','right'].forEach(d=>{
        const [dx,dy]=dirs[d], nx=x+dx, ny=y+dy;
        if(inB(nx,ny)&&!ally(nx,ny)) moves.push({x:nx,y:ny});
      }); break;
  }
  return moves;
}

function renderHighlights() {
  const c = document.getElementById('pieces-container');
  c.querySelectorAll('.highlight').forEach(el=>el.remove());
  highlights.forEach(pos=>{
    const d = document.createElement('div');
    d.className = 'highlight';
    d.style.left = `${30 + pos.x*60}px`;
    d.style.top  = `${30 + pos.y*60}px`;
    d.addEventListener('click', onHighlightClick);
    c.appendChild(d);
  });
  if(selected) {
    const s = document.createElement('div');
    s.className = 'highlight selected';
    s.style.left = `${30 + selected.x*60}px`;
    s.style.top  = `${30 + selected.y*60}px`;
    document.getElementById('pieces-container').appendChild(s);
  }
}

function clearHighlights() {
  highlights = [];
  selected = null;
  document.querySelectorAll('.highlight').forEach(el=>el.remove());
}

function onHighlightClick(e) {
  const nx = (+e.target.style.left.match(/\d+/)[0] - 30)/60;
  const ny = (+e.target.style.top.match(/\d+/)[0] - 30)/60;
  const fx = selected.x, fy = selected.y;
  historyStack.push({
    from:{ x:fx,y:fy,piece:boardState[fy][fx] },
    to:  { x:nx,y:ny,piece:boardState[ny][nx] }
  });
  const tgt = boardState[ny][nx];
  boardState[fy][fx] = null;
  boardState[ny][nx] = selected.piece;
  if(tgt && tgt.type==='general') alert(`${turn.toUpperCase()} wins!`);
  clearHighlights();
  renderPieces();
  showConfirmUndo();
}

function showConfirmUndo() {
  if(document.getElementById('move-controls')) return;
  const ctrl = document.createElement('div');
  ctrl.id = 'move-controls';
  ctrl.innerHTML = `<button id="undo">Undo</button><button id="confirm">Confirm</button>`;
  Object.assign(ctrl.style, {
    position:'absolute', bottom:'20px', left:'50%',
    transform:'translateX(-50%)', zIndex: 4
  });
  document.body.appendChild(ctrl);
  ctrl.querySelector('#undo').onclick = undoMove;
  ctrl.querySelector('#confirm').onclick = confirmMove;
}

function undoMove() {
  const last = historyStack.pop();
  if(!last) return;
  boardState[last.from.y][last.from.x] = last.from.piece;
  boardState[last.to.y][last.to.x]     = last.to.piece;
  document.getElementById('move-controls').remove();
  renderPieces();
}

function confirmMove() {
  document.getElementById('move-controls').remove();
  turn = turn==='red'? 'black':'red';
}

window.onload = () => {
  if(localStorage.getItem('inGame')==='true') {
    document.getElementById('menu').style.display = 'none';
    document.getElementById('game-board').style.display = 'block';
    initBoard();
    renderPieces();
  }
};
