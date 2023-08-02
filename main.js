'use strict';

// global //

var gBoard;
var minesLocation;
var gLevel = { SIZE: 4, MINES: 2 };
const WIN = '😎';
const LOSE = '🥺';
const NORMAL = '🙂';
const SHOW = 'SHOW';
const HIDE = 'HIDE';
var totalFlags = gLevel.MINES;

// ? how can we use that properties ? //

var gGame = {
  isOn: false,
  shownCount: 0,
  markedCount: 0,
  secsPassed: 0,
};

var flagEnabled = false; // ? do we need it ? // yes!
var isFirstClick = true;
var gameOver = false;
var timer;

// initializing //

function onInit() {
  gBoard = buildBoard(gLevel.SIZE, gLevel.MINES); // * build board as soon as the page loads
  renderBoard(gBoard);
  renderClock();
  renderFlags();
  //   renderMinesCount();
  emojiReload(false, false); // * false/true as we want to set the right emoji //
}

// creating the game board //

function buildBoard(boardSize, minesNumber) {
  var board = [];
  minesLocation = getMinesLocation(boardSize, minesNumber);
  for (var i = 0; i < boardSize; i++) {
    board[i] = [];
    for (var j = 0; j < boardSize; j++) {
      var isMine = false;

      for (var k = 0; k < minesLocation.length; k++) {
        // ! checks if the places are the same //
        if (minesLocation[k].i === i && minesLocation[k].j === j) {
          isMine = true; // * setting the isMine according to the result in getMinesLocation() //
          break;
        }
      }

      // todo: cell object //

      const cell = {
        type: 'HIDE',
        minesAroundCount: 0,
        isMine: isMine,
        isFlagged: false,
        location: { i, j },
      };
      board[i][j] = cell;
    }
  }

  // todo: setMineAroundscount //
  for (var i = 0; i < board.length; i++) {
    for (var j = 0; j < board.length; j++) {
      board[i][j].minesAroundCount = setMinesNegsCount(board, i, j);
    }
  }
  console.log(board);
  return board;
}

// render board //

function renderBoard(board) {
  var strHTML = ``;
  for (var i = 0; i < board.length; i++) {
    strHTML += `<tr>\n`;
    for (var j = 0; j < board.length; j++) {
      const cell = gBoard[i][j];
      var className = '';
      var innerText = '';
      if (cell.type === SHOW) {
        className = 'clicked';
        if (cell.isMine) {
          className += ' mine';
          innerText += '💣';
        }
      }
      strHTML += `\t<td class="${className}" onclick="onCellClicked(this, ${i}, ${j})" >${innerText}</td>\n`;
    }
    strHTML += `</tr>\n`;
  }
  const elBoard = document.querySelector('.board');
  elBoard.innerHTML = strHTML;
  //   console.log(board);
}

// make cell clicked function //

function onCellClicked(elTile, i, j) {
  const tile = gBoard[i][j];
  //   if (isFirstClick) isFirstClick(i, j);
  if (!tile.isMine) {
    tile.type = SHOW;
  } else {
    tile.type = SHOW;
    elTile.classList.add('mine');
    gameOver = true;
    // gameOver();
  }

  renderBoard(gBoard);

  console.log('Cell clicked: ', elTile, i, j);

  //   elCell.classList.add('selected');

  //   if (gElSelectedSeat) {
  //     gElSelectedSeat.classList.remove('selected');
  //   }

  //   gElSelectedSeat = gElSelectedSeat !== elCell ? elCell : null;

  // When seat is selected a popup is shown
  //   if (gElSelectedSeat) {
  //     showSeatDetails({ i, j });
  //   } else {
  //     hideSeatDetails();
  //   }
}

// mines location //

function getMinesLocation(boardSize, minesNumber) {
  const boardCopy = [];
  const positions = [];
  for (var i = 0; i < boardSize; i++) {
    boardCopy[i] = [];
    for (var j = 0; j < boardSize; j++) {
      boardCopy[i][j] = 0;
    }
  }

  // ! making sure theres unique loacatin for the mines //

  while (positions.length < minesNumber) {
    const i = getRandomInt(0, boardSize - 1);
    const j = getRandomInt(0, boardSize - 1);

    if (boardCopy[i][j] === 0) {
      // * comparing two array's so we could get unique places //
      boardCopy[i][j] = 1;
      positions.push({ i, j });
    }
  }
  return positions;
}

// render clock //

function renderClock() {
  //   gGame.isOn = true;
  var seconds = gGame.secsPassed;
  var minutes = 0;
  const timeDiv = document.querySelector('.d2');
  timeDiv.innerText = '00:00';
  timer = setInterval(() => {
    if (seconds >= 60) {
      minutes++;
      seconds = '0';
    }
    if (seconds < 10) {
      seconds = '0' + seconds;
    }
    if (minutes >= 10) {
      timeDiv.innerText = `${minutes}:${seconds}`;
    } else {
      timeDiv.innerText = `0${minutes}:${seconds}`;
    }
    seconds++;
    // console.log(seconds);
  }, 1000);
}

// render emogis //

function emojiReload(win, lose) {
  const emogiDiv = document.querySelector('.d1');
  emogiDiv.addEventListener('click', function () {
    location.reload();
  });
  if (win) {
    clearInterval(timer);
    return (emogiDiv.innerText = WIN);
  } else if (lose) {
    clearInterval(timer);
    return (emogiDiv.innerText = LOSE);
  } else {
    return (emogiDiv.innerText = NORMAL);
  }
}

// render flags //
function renderFlags() {
  const flag = document.querySelector('.d0');
  var flagCount = totalFlags;
  flag.innerText = '🚩' + flagCount;
  flagCount--;

  flag.addEventListener('click', function () {
    if (flagEnabled) {
      flagEnabled = false;
      flag.classList.remove('clicked');
      flagCount--;
    } else {
      flagEnabled = true;
      flag.classList.add('clicked');
      flagCount++;
    }
  });
}

// render the info divs //

for (var i = 0; i < 3; i++) {
  const infoDiv = document.querySelector('.info-div');
  const newDIV = document.createElement('div');
  infoDiv.append(newDIV);
  newDIV.classList.add(`d${i}`);
}

// get the mines around //

function setMinesNegsCount(board, rowIdx, colIdx) {
  var count = 0;
  for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
    if (i < 0 || i >= board.length) continue;
    for (var j = colIdx - 1; j <= colIdx + 1; j++) {
      if (i === rowIdx && j === colIdx) continue;
      if (j < 0 || j >= board[0].length) continue;
      var currCell = board[i][j];
      if (currCell.isMine) count++;
    }
  }
  return count;
}

// get random number //

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min);
}

// function isFirstClick(i, j) {

// }

// gameOver();
