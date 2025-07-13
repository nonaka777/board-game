const express = require('express')
const expressWs = require('express-ws')
const app = express()
expressWs(app)

const port = process.env.PORT || 3001
app.use(express.static('public'))


let players = []
let board = Array.from({ length: 6 }, () => []) // 盤面
let currentTurn = 0
players.push({ ws, id: playerId, color })

app.ws('/ws', (ws) => {//定員2
  if (players.length >= 2) {
    ws.send(JSON.stringify({ type: 'full' }))
    return ws.close()
  }

  const playerId = Math.random().toString(36).substr(2, 8)
  const color = players.length === 0 ? 'red' : 'blue'

  players.push({ ws, id: playerId, color })
  console.log(`Player connected: ${playerId} (${color})`)

  // プレイヤーに初期情報を送る
  if (players.length === 2) {
  players.forEach((p, i) => {
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

      const win =  victry(col, row, players[playerIndex].color)

      // 全員に更新を送信
      result({
        type: 'update',
        col,
        row,
        color: players[playerIndex].color,
        nextTurn: players[(currentTurn + 1) % 2].id,
        winner: win ? players[playerIndex].id : null
      })

      if (!win) currentTurn = (currentTurn + 1) % 2
    }
  })

  ws.on('close', () => {
    players = players.filter(p => p.ws !== ws)
    board = Array.from({ length: 6 }, () => [])
    currentTurn = 0
    result({ type: 'reset' })
  })
})

function victry(col, row, color) {

        // プレイヤー(stone)切り替え


        function countSameColor(goC, goR) {

          let count = 1; // 自分自身をカウント
          let c = col + goC;
          let r = row + goR;
          while (c >= 0 && c < cols && r >= 0 && r < rows && board[c][r] === stone) {
            count++;
            c += goC;
            r += goR;
          }

          // 負
          c = col - goC;
          r = row - goR;
          while (c >= 0 && c < cols && r >= 0 && r < rows && board[c][r] === stone) {
            count++;
            c -= goC;
            r -= goR;
          }

          return count;

        }
        if (countSameColor(0, 1) >= 4 ||    // 縦
          countSameColor(1, 0) >= 4 ||      // 横
          countSameColor(1, 1) >= 4 ||      // 斜め（右下）
          countSameColor(-1, 1) >= 4        // 斜め（左下）
        ) {
          alert(color+`サイドの勝利`);
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

