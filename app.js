const express = require('express')
const expressWs = require('express-ws')
const app = express()
expressWs(app)

const port = process.env.PORT || 3001
app.use(express.static('public'))


let players = []
let board = Array.from({ length: 6 }, () => []) // 盤面
let currentTurn = 0
//const statusMessage = document.getElementById('status-message')

app.ws('/ws', (ws) => {//定員2
if (players.length > 2) {
    ws.send(JSON.stringify({ type: 'full' }))
    return ws.close()
  }

  
  const playerId = Math.random().toString(36).substr(2, 8)
  const color = players.length === 0 ? 'red' : 'blue'
  const player = { ws, id: playerId, color }

  players.push({ ws, id: playerId, color })
  console.log(`Player connected: ${playerId} (${color})`)

  // プレイヤーに初期情報を送る
  if (players.length === 2) {
    players.forEach(p => {
      p.ws.send(JSON.stringify({
        type: 'init',
        id: p.id,
        color: p.color,
        turn: players[currentTurn].id
      }))
    })
  }
  ws.on('message', (msg) => {//受信
    const data = JSON.parse(msg)

    if (data.type === 'place') {//stone情報
      const playerIndex = players.findIndex(p => p.id === data.id)
      if (playerIndex !== currentTurn) return

      const col = data.col
      if (col < 0 || col >= 6 || board[col].length >= 6) return

      const row = board[col].length
      board[col].push(players[playerIndex].color)

      const win = victry(col, row, players[playerIndex].color)

      // 全員に更新を送信
      result({
        type: 'update',
        col,
        row,
        color: players[playerIndex].color,
        nextTurn: players[(currentTurn + 1) % 2].id,
        winner: win ? players[playerIndex].id : null, // ←追加
        //message: win ? `${players[playerIndex].color}の勝ち！` : null 

      })

      if (!win) currentTurn = (currentTurn + 1) % 2
    }
    if (data.type === "rotate") {
      if (players[currentTurn].id !== data.id) return;
      // 盤面回転
      const cols = 6, rows = 6;
      const newBoard = Array.from({ length: cols }, () => []);
      for (let col = 0; col < cols; col++) {
        for (let row = 0; row < board[col].length; row++) {
          newBoard[row][cols - 1 - col] = board[col][row];
        }
      }
      for (let col = 0; col < cols; col++) {
        newBoard[col] = newBoard[col].filter(x => x);
      }
      board = newBoard;
      currentTurn = (currentTurn + 1) % 2;
      result({
        type: "rotate",
        board,
        nextTurn: players[currentTurn].id
      });
    }
  })

  ws.on('close', () => {
    console.log(`Player ${playerId} disconnected`)
    players = players.filter(p => p.ws !== ws)
    board = Array.from({ length: 6 }, () => [])
    currentTurn = 0
    broadcast({ type: 'reset' })
  })
})

function victry(col, row, color) {
  const cols = 6;
  const rows = 6;

  function countSameColor(goC, goR) {
    let count = 1;
    let c = col + goC;
    let r = row + goR;
    while (c >= 0 && c < cols && r >= 0 && r < rows && board[c][r] === color) {
      count++;
      c += goC;
      r += goR;
    }
    // 負方向
    c = col - goC;
    r = row - goR;
    while (c >= 0 && c < cols && r >= 0 && r < rows && board[c][r] === color) {
      count++;
      c -= goC;
      r -= goR;
    }
    return count;
  }

  if (
    countSameColor(0, 1) >= 4 ||    // 縦
    countSameColor(1, 0) >= 4 ||    // 横
    countSameColor(1, 1) >= 4 ||    // 斜め（右下）
    countSameColor(-1, 1) >= 4      // 斜め（左下）
  ) {
    return true;
  }
  return false;
}
      

function result(obj) {
  const json = JSON.stringify(obj)
  players.forEach(p => p.ws.send(json))
}



app.listen(port, () => {
  console.log(`http://localhost:${port}`)
})
//whose-tarn
// const express = require('express')
// const expressWs = require('express-ws')

// const app = express()
// expressWs(app)

// const port = process.env.PORT || 3001
// let connects = []

// app.use(express.static('public'))

// app.ws('/ws', (ws, req) => {
//   connects.push(ws)

//   ws.on('message', (message) => {
//     console.log('Received:', message)

//     connects.forEach((socket) => {
//       if (socket.readyState === 1) {
//         // Check if the connection is open
//         socket.send(message)
//       }
//     })
//   })

//   ws.on('close', () => {
//     connects = connects.filter((conn) => conn !== ws)
//   })
// })

// app.listen(port, () => {
//   console.log(`Server is running on http://localhost:${port}`)
// })

