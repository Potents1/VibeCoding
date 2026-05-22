const board = document.getElementById('board');
const pieces = {0:'♜',1:'♞',2:'♝',3:'♛',4:'♚',5:'♝',6:'♞',7:'♜',8:'♟',9:'♟',10:'♟',11:'♟',12:'♟',13:'♟',14:'♟',15:'♟',48:'♙',49:'♙',50:'♙',51:'♙',52:'♙',53:'♙',54:'♙',55:'♙',56:'♖',57:'♘',58:'♗',59:'♕',60:'♔',61:'♗',62:'♘',63:'♖'};
for (let i = 0; i < 64; i++) { const sq = document.createElement('div'); sq.className = `sq ${((Math.floor(i/8)+i)%2===0)?'light':'dark'}`; sq.textContent = pieces[i] || ''; board.appendChild(sq); }
