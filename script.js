// === MENU FUNCTIONS ===
function viewHistory()    { alert("Xem lịch sử các ván cờ!"); }
function openSettings()   { alert("Mở cài đặt trò chơi!"); }

// === INITIAL SETUP ===
const initialPositions = [
  // Đen
  { type:'chariot', color:'black', x:0, y:0 },
  { type:'horse',   color:'black', x:1, y:0 },
  { type:'elephant',color:'black', x:2, y:0 },
  { type:'advisor', color:'black', x:3, y:0 },
  { type:'general', color:'black', x:4, y:0 },
  { type:'advisor', color:'black', x:5, y:0 },
  { type:'elephant',color:'black', x:6, y:0 },
  { type:'horse',   color:'black', x:7, y:0 },
  { type:'chariot', color:'black', x:8, y:0 },
  { type:'cannon',  color:'black', x:1, y:2 },
  { type:'cannon',  color:'black', x:7, y:2 },
  { type:'soldier', color:'black', x:0, y:3 },
  { type:'soldier', color:'black', x:2, y:3 },
  { type:'soldier', color:'black', x:4, y:3 },
  { type:'soldier', color:'black', x:6, y:3 },
  { type:'soldier', color:'black', x:8, y:3 },
  // Đỏ
  { type:'chariot', color:'red', x:0, y:9 },
  { type:'horse',   color:'red', x:1, y:9 },
  { type:'elephant',color:'red', x:2, y:9 },
  { type:'advisor', color:'red', x:3, y:9 },
  { type:'general', color:'red', x:4, y:9 },
  { type:'advisor', color:'red', x:5, y:9 },
  { type:'elephant',color:'red', x:6, y:9 },
  { type:'horse',   color:'red', x:7, y:9 },
  { type:'chariot', color:'red', x:8, y:9 },
  { type:'cannon',  color:'red', x:1, y:7 },
  { type:'cannon',  color:'red', x:7, y:7 },
  { type:'soldier', color:'red', x:0, y:6 },
  { type:'soldier', color:'red', x:2, y:6 },
  { type:'soldier', color:'red', x:4, y:6 },
  { type:'soldier', color:'red', x:6, y:6 },
  { type:'soldier', color:'red', x:8, y:6 },
];

let boardState = [];
let turn = 'red';
let selected = null;
let highlights = [];
let historyStack = [];

// === CONSTANTS ===
const CELL_W = 60, CELL_H = 60, OFFSET_X = 30, OFFSET_Y = 30;

// === BOARD SETUP ===
function initBoard() {
  boardState = Array.from({ length: 10 }, () => Array(9).fill(null));
  initialPositions.forEach(p => boardState[p.y][p.x] = { ...p });
}

// === MENU HANDLERS ===
function startNewGame() {
  document.getElementById('menu').style.display      = 'none';
  document.getElementById('game-board').style.display= 'block';
  initBoard();
  renderBoardGrid();
  renderPieces();
  updateTurnIndicator();
  localStorage.setItem('inGame','true');
}

function returnToMenu() {
  localStorage.removeItem('inGame');
  document.getElementById('game-board').style.display= 'none';
  document.getElementById('menu').style.display      = 'block';
}

// === RENDER GRID CELLS ===
function renderBoardGrid() {
  const container = document.getElementById('board-cells-container');
  container.innerHTML = '';
  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 9; x++) {
      const cell = document.createElement('div');
      cell.className = 'board-cell';
      cell.style.left = `${OFFSET_X + x * CELL_W}px`;
      cell.style.top  = `${OFFSET_Y + y * CELL_H}px`;
      cell.dataset.x = x;
      cell.dataset.y = y;
      cell.addEventListener('click', onCellClick);
      container.appendChild(cell);
    }
  }
}

// === RENDER PIECES & HIGHLIGHTS ===
function renderPieces() {
  const container = document.getElementById('pieces-container');
  container.innerHTML = '';
  boardState.forEach((row, y) => row.forEach((cell, x) => {
    if (!cell) return;
    const img = document.createElement('img');
    img.src = `assets/pieces/${cell.color}/${cell.type}.png`;
    img.alt = `${cell.color} ${cell.type}`;
    img.className = 'piece';
    img.style.left = `${OFFSET_X + x * CELL_W + CELL_W/2}px`;
    img.style.top  = `${OFFSET_Y + y * CELL_H + CELL_H/2}px`;
    img.dataset.x = x; img.dataset.y = y;
    img.addEventListener('click', onPieceClick);
    container.appendChild(img);
  }));
  renderHighlights();
}

function renderHighlights() {
  const c = document.getElementById('pieces-container');
  c.querySelectorAll('.highlight').forEach(el => el.remove());
  highlights.forEach(pos => {
    const d = document.createElement('div');
    d.className = 'highlight';
    d.style.left = `${OFFSET_X + pos.x * CELL_W}px`;
    d.style.top  = `${OFFSET_Y + pos.y * CELL_H}px`;
    d.dataset.x = pos.x; d.dataset.y = pos.y;
    d.addEventListener('click', () => movePiece(selected.x, selected.y, pos.x, pos.y));
    c.appendChild(d);
  });
  if (selected) {
    const s = document.createElement('div');
    s.className = 'highlight selected';
    s.style.left = `${OFFSET_X + selected.x * CELL_W}px`;
    s.style.top  = `${OFFSET_Y + selected.y * CELL_H}px`;
    c.appendChild(s);
  }
}

function clearHighlights() {
  highlights = [];
  selected = null;
  document.querySelectorAll('.highlight').forEach(el => el.remove());
}

// === CLICK HANDLERS ===
function onPieceClick(e) {
  e.stopPropagation(); // tránh click cell bên dưới
  const x = +e.target.dataset.x, y = +e.target.dataset.y;
  if (boardState[y][x].color !== turn) return;
  clearHighlights();
  selected = { x, y, piece: boardState[y][x] };
  highlights = getLegalMoves(x, y, selected.piece);
  renderHighlights();
}

function onCellClick(e) {
  const x = +e.currentTarget.dataset.x, y = +e.currentTarget.dataset.y;
  const cellPiece = boardState[y][x];
  if (selected) {
    // Move hoặc select lại
    const valid = highlights.some(h=>h.x===x && h.y===y);
    if (valid) { movePiece(selected.x, selected.y, x, y); return; }
    if (cellPiece && cellPiece.color===turn) {
      clearHighlights();
      selected = { x, y, piece: cellPiece };
      highlights = getLegalMoves(x, y, cellPiece);
      renderHighlights();
      return;
    }
    clearHighlights();
  } else if (cellPiece && cellPiece.color===turn) {
    // Chọn quân
    selected = { x, y, piece: cellPiece };
    highlights = getLegalMoves(x, y, cellPiece);
    renderHighlights();
  }
}

// === MOVE & UNDO/CONFIRM ===
function movePiece(fx, fy, nx, ny) {
  historyStack.push({
    from:{ x:fx,y:fy,piece:boardState[fy][fx] },
    to:  { x:nx,y:ny,piece:boardState[ny][nx] }
  });
  boardState[ny][nx] = boardState[fy][fx];
  boardState[fy][fx] = null;
  clearHighlights();
  renderPieces();
  showConfirmUndo();

  const opp = turn==='red'?'black':'red';
  if (isInCheck(opp)) {
    alert(`${turn.toUpperCase()} chiếu tướng!`);
    if (isCheckmate(opp)) {
      alert(`CHIẾU BÍ! ${turn.toUpperCase()} THẮNG!`);
      endGame();
    }
  }
}

function showConfirmUndo() {
  if (document.getElementById('move-controls')) return;
  const ctrl = document.createElement('div');
  ctrl.id = 'move-controls';
  ctrl.innerHTML = `<button id="undo">Undo</button><button id="confirm">Confirm</button>`;
  Object.assign(ctrl.style, {
    position:'absolute', bottom:'20px', left:'50%',
    transform:'translateX(-50%)', zIndex:4
  });
  document.body.appendChild(ctrl);
  ctrl.querySelector('#undo').onclick    = undoMove;
  ctrl.querySelector('#confirm').onclick = confirmMove;
}

function undoMove() {
  const last = historyStack.pop();
  if (!last) return;
  boardState[last.from.y][last.from.x] = last.from.piece;
  boardState[last.to.y][ last.to.x]   = last.to.piece;
  document.getElementById('move-controls').remove();
  renderPieces();
}

function confirmMove() {
  document.getElementById('move-controls').remove();
  turn = turn==='red'?'black':'red';
  updateTurnIndicator();
}

// === CHECK/CHECKMATE LOGIC ===
function isInCheck(color) {
  let kx, ky;
  for (let y=0;y<10;y++) for (let x=0;x<9;x++){
    const p=boardState[y][x];
    if (p&&p.type==='general'&&p.color===color){
      kx=x; ky=y; break;
    }
  }
  if (kx===undefined) return false;
  for (let y=0;y<10;y++) for (let x=0;x<9;x++){
    const p=boardState[y][x];
    if (p&&p.color!==color) {
      const moves = getRawMoves(x,y,p);
      if (moves.some(m=>m.x===kx&&m.y===ky)) return true;
    }
  }
  return false;
}

function getRawMoves(x,y,piece) {
  const old = turn; turn = piece.color;
  const m = getLegalMoves(x,y,piece);
  turn = old; return m;
}

function isCheckmate(color) {
  for (let y=0;y<10;y++) for (let x=0;x<9;x++){
    const p=boardState[y][x];
    if (p&&p.color===color) {
      const moves=getLegalMoves(x,y,p);
      for (const m of moves) {
        const bfFrom=boardState[y][x], bfTo=boardState[m.y][m.x];
        boardState[y][x]=null; boardState[m.y][m.x]=p;
        const inChk = isInCheck(color);
        boardState[y][x]=bfFrom; boardState[m.y][m.x]=bfTo;
        if (!inChk) return false;
      }
    }
  }
  return true;
}

// === MOVE GENERATION ===
function getLegalMoves(x,y,p) {
  const moves=[], dirs={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
  const inB=(x,y)=>x>=0&&x<9&&y>=0&&y<10;
  const ally=(x,y)=>inB(x,y)&&boardState[y][x]&&boardState[y][x].color===p.color;
  const enemy=(x,y)=>inB(x,y)&&boardState[y][x]&&boardState[y][x].color!==p.color;

  switch(p.type) {
    case 'chariot':
      for (let d of Object.values(dirs)) {
        let nx=x+d[0], ny=y+d[1];
        while(inB(nx,ny)){
          if (!boardState[ny][nx]) moves.push({x:nx,y:ny});
          else { if (enemy(nx,ny)) moves.push({x:nx,y:ny}); break; }
          nx+=d[0]; ny+=d[1];
        }
      } break;

    case 'horse':
      for (let [dx,dy] of [[2,1],[2,-1],[-2,1],[-2,-1],[1,2],[1,-2],[-1,2],[-1,-2]]) {
        const bx=x+(Math.abs(dx)===2?dx/2:0),
              by=y+(Math.abs(dy)===2?dy/2:0),
              nx=x+dx, ny=y+dy;
        if (inB(nx,ny)&&!boardState[by][bx]&&!ally(nx,ny)) moves.push({x:nx,y:ny});
      } break;

    case 'elephant':
      for (let [dx,dy] of [[2,2],[2,-2],[-2,2],[-2,-2]]) {
        const mx=x+dx/2,my=y+dy/2,nx=x+dx,ny=y+dy,
              ok=(p.color==='red'?ny>=5:ny<=4);
        if (inB(nx,ny)&&ok&&!boardState[my][mx]&&!ally(nx,ny)) moves.push({x:nx,y:ny});
      } break;

    case 'advisor':
      for (let [dx,dy] of [[1,1],[1,-1],[-1,1],[-1,-1]]) {
        const nx=x+dx, ny=y+dy,
              inP=nx>=3&&nx<=5&&((p.color==='red'&&ny>=7)||(p.color==='black'&&ny<=2));
        if (inP&&!ally(nx,ny)) moves.push({x:nx,y:ny});
      } break;

    case 'general':
      for (let d of Object.values(dirs)) {
        const nx=x+d[0], ny=y+d[1],
              inP=nx>=3&&nx<=5&&((p.color==='red'&&ny>=7)||(p.color==='black'&&ny<=2));
        if (inP&&!ally(nx,ny)) moves.push({x:nx,y:ny});
      }
      // tướng đối diện
      if (p.color==='red') {
        for (let ty=y-1;ty>=0;ty--){
          if (boardState[ty][x]) {
            if (boardState[ty][x].type==='general') moves.push({x,y:ty});
            break;
          }
        }
      } else {
        for (let ty=y+1;ty<10;ty++){
          if (boardState[ty][x]) {
            if (boardState[ty][x].type==='general') moves.push({x,y:ty});
            break;
          }
        }
      } break;

    case 'cannon':
      for (let d of Object.values(dirs)) {
        let nx=x+d[0], ny=y+d[1], jumped=false;
        while (inB(nx,ny)) {
          if (!boardState[ny][nx]) {
            if (!jumped) moves.push({x:nx,y:ny});
          } else {
            if (!jumped) jumped=true;
            else { if (enemy(nx,ny)) moves.push({x:nx,y:ny}); break; }
          }
          nx+=d[0]; ny+=d[1];
        }
      } break;

    case 'soldier':
      const fwd = p.color==='red'? -1:1;
      if (inB(x,y+fwd)&&!ally(x,y+fwd)) moves.push({x,y:y+fwd});
      const cross = p.color==='red'? y<5: y>4;
      if (cross) {
        if (inB(x-1,y)&&!ally(x-1,y)) moves.push({x:x-1,y});
        if (inB(x+1,y)&&!ally(x+1,y)) moves.push({x:x+1,y});
      }
      break;
  }
  return moves;
}

// === TURN & RESIGN ===
function updateTurnIndicator() {
  const t = document.getElementById('turn-text');
  t.textContent = turn==='red'? 'Đỏ':'Đen';
  t.style.color = turn==='red'? '#c00':'#000';
}

function resign() {
  const winner = turn==='red'? 'ĐEN':'ĐỎ';
  if (confirm(`Bạn có chắc muốn đầu hàng? ${winner} sẽ thắng!`)) {
    alert(`💥 ${winner} THẮNG DO ĐỐI PHƯƠNG ĐẦU HÀNG!`);
    endGame();
  }
}

function endGame() {
  localStorage.removeItem('inGame');
  returnToMenu();
}

// === INITIAL LOAD ===
window.onload = () => {
  document.getElementById('resign-btn').addEventListener('click', resign);
  if (localStorage.getItem('inGame')==='true') {
    document.getElementById('menu').style.display       = 'none';
    document.getElementById('game-board').style.display = 'block';
    initBoard();
    renderBoardGrid();
    renderPieces();
    updateTurnIndicator();
  }
};

