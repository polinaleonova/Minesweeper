
var FullGameData = {
    'easy': {
        currentFieldSize: 8,
        flags_count: 10
    },
    'hard':{
        currentFieldSize: 16,
        flags_count: 16
    }
};

var mediator = {
    parameters: undefined,
    field: undefined,

    sayToPropObjThatFlagWasSet: function(activeCell) {
        this.parameters.CheckAndRemoveIfFlagsNotNull(activeCell)
    },
    sayToPropObjThatFlagWasCancel: function(activeCell) {
        this.parameters.addFlag(activeCell)
    },
    getStartParameters: function(parameters, currentFieldSize, generalFlagsCount) {
        this.parameters && this.parameters.destroy();
        this.parameters = parameters;
        this.createRandomMinedField(currentFieldSize, generalFlagsCount);
    },
    createRandomMinedField: function(currentFieldSize, generalFlagsCount) {
        var resultImg, field;
        this.field && this.field.destroy();
        resultImg = document.getElementById('result');
        if (resultImg.classList.contains('loose-game')) {
            resultImg.classList.remove('loose-game')
        } else if (resultImg.classList.contains('win-game')) {
            resultImg.classList.remove('win-game')
        }
        field = new Field(this, currentFieldSize, generalFlagsCount);
        field.createField();
        this.field = field;
    },
    startGame: function() {
        this.parameters.createInterval(this.parameters.timeCount);
    },
    stopGame: function(result) {
        var fieldTable, resultImg;
        fieldTable = document.getElementById('mines_field').firstElementChild;
        resultImg = document.getElementById('result');
        this.parameters.stopTimer();
        fieldTable.style.pointerEvents = "none";

        if (result === 'fail' || result === 'full_loser') {
            resultImg.classList.add('loose-game');
            if (result === 'full_loser') {
                document.getElementById('message').classList.toggle('hidden')
            }
        } else {
            resultImg.classList.add('win-game');
        }
    }
};

var level;
var level_default = 'easy';

var Field = function(mediator, currentFieldSize, generalFlagsCount) {
    this.currentFieldSize = currentFieldSize;
    this.generalFlagsCount = generalFlagsCount;
    this.mediator = mediator;
    this.fieldObj = undefined;
    this.fieldTable = undefined;
    this.cellsNumber = undefined;
};
Field.prototype = {
    createField: function() {
        var fieldTableContent, minedCellsObj, fieldContainer, cellsFieldList;
        var self = this;
        
        cellsFieldList = getCellsFieldList(this.currentFieldSize);
        self.cellsNumber = Math.pow(this.currentFieldSize, 2);
        minedCellsObj = randomMinesScattering(cellsFieldList, self.cellsNumber, this.generalFlagsCount);
        self.fieldObj = runCounterOfMinedNeighborsForCell(minedCellsObj, cellsFieldList, this.currentFieldSize);
        fieldContainer = document.getElementById('mines_field');
        fieldTableContent = '<tbody>';
        
        for (var row = 0; row<this.currentFieldSize; row++) {
            fieldTableContent+='<tr>';
            for (var column = 0; column < this.currentFieldSize; column++ ) {
                fieldTableContent += '<td id='+ row+'_'+column+'></td>'; //self.fieldObj[row+'_'+column]['mined']
            }
            fieldTableContent+='</tr>'
        }
        
        fieldTableContent+='</tbody>';
        self.fieldTable = document.createElement('table');
        self.fieldTable.innerHTML = fieldTableContent;
        fieldContainer.appendChild(self.fieldTable);
        self.fieldTable.style.pointerEvents = "all";
        self.fieldTable.addEventListener('mousedown', self.clickHandler.bind(self), false);
    },
    clickHandler: function(event) {
        var allOpenedCells;
        var self = this;
        if (document.querySelectorAll('[opened],[flag]').length == 0) {
           self.mediator.startGame()
        }
        var activeCell = event.target;
        if (event.which == 3) {
            self.sayToMediatorSetOrUnsetFlag(activeCell);
        } else if (event.which == 1) {
            self.openCellAndcheckNeighbors(activeCell.id);
        }
        allOpenedCells = document.getElementsByClassName('opened');
        if (allOpenedCells.length === self.cellsNumber - self.generalFlagsCount) {
            self.mediator.stopGame('win')
        }
    },
    destroy: function() {
        var self = this;
        self.fieldTable.removeEventListener("mousedown", false);
        self.fieldTable.remove();
    },
    sayToMediatorSetOrUnsetFlag: function(activeCell) {
        if (!activeCell.hasAttribute('opened') || activeCell.hasAttribute('flag')) {
            if (!activeCell.hasAttribute('flag')) {
                this.mediator.sayToPropObjThatFlagWasSet(activeCell);
            } else {
                this.mediator.sayToPropObjThatFlagWasCancel(activeCell);
            }
        }
    },
    openCellAndcheckNeighbors: function(cellId) {
        var cell, minedNeighborsNumber;
        
        cell = document.getElementById(cellId);
        if (this.fieldObj[cellId]['mined']) {
            for (currentCell in this.fieldObj) {
                if (!this.fieldObj.hasOwnProperty(currentCell)) continue;
                if (this.fieldObj[currentCell]['mined']) {
                    document.getElementById(currentCell).classList.add('mined');
                }
            }
            if (document.querySelectorAll('[opened]').length == 0){
                this.mediator.stopGame('full_loser');
                return
            }
            this.mediator.stopGame('fail')
        } else {
            minedNeighborsNumber = this.fieldObj[cellId]['minedNeighbors'];
            cell.innerHTML = minedNeighborsNumber;
            cell.setAttribute('opened', '');
            cell.classList.add('opened');
            if (minedNeighborsNumber == 0) {
                cell.innerHTML = 0;
                this.openFreeField(cellId);
            }
        }
    },
    openFreeField:function(zeroCell) {
        var  cell, currentNeighbor;
        var coord = zeroCell.split("_");
        var x = coord[0];
        var y = coord[1];
        
        for (var i = x - 1; i <= +x + 1; i++) {
            for (var j = y - 1; j <= +y + 1; j++) {
                if (i >= 0 && i < this.currentFieldSize && j >= 0 && j < this.currentFieldSize && !( i == x && j == y)) {
                    currentNeighbor = i + "_" + j;
                    if (this.fieldObj[currentNeighbor]['mined']) {
                        break
                    }
                    else {
                        cell = document.getElementById(currentNeighbor);
                        if (!cell.hasAttribute('opened')) {
                            cell.innerHTML = this.fieldObj[currentNeighbor]['minedNeighbors'];
                            cell.setAttribute('opened', '');
                            cell.classList.add('opened');
                            this.sayToMediatorSetOrUnsetFlag(cell);
                            if (this.fieldObj[currentNeighbor]['minedNeighbors'] == 0) {
                                this.openFreeField(currentNeighbor)
                            }
                        }
                    }
                }
            }
        }
    }
};
var GameParameters = function(level, mediator) {
    this.mediator = mediator;
    this.currentFieldSize = FullGameData[level].currentFieldSize;
    this.flags_count =  FullGameData[level].flags_count;
    this.cellsNumber = FullGameData[level].cellsNumber;
    this.timeCount = 0;
    this.interval = undefined;
    this.createInterval = function() {
        var prevVal, time_element;
        var self = this;
        self.interval = setInterval(function() {
            prevVal = self.timeCount;
            self.timeCount = prevVal + 1;
            if ( self.timeCount === 999) {
                self.mediator.stopGame('fail');
            }
            time_element = document.getElementById('timer');
            time_element.innerHTML = self.convertTimeCount();
        }, 1000)
    };
    this.destroy = function() {
        this.stopTimer();
        document.getElementById('timer').innerHTML = "0";
    };
    this.stopTimer = function() {
        clearInterval(this.interval);
    };
    this.convertTimeCount = function() {
        //todo return string with 3-rank number like "004", "023"
        var string_length = 3;
        return this.timeCount.toString();
    };
    this.CheckAndRemoveIfFlagsNotNull = function(activeCell) {
        if (this.flags_count>0) {
            this.flags_count -= 1;
            document.getElementById('flags_count').innerHTML = this.flags_count;
            activeCell.setAttribute('flag','');
            activeCell.classList.add('flag');
        }
    };
    this.addFlag = function(activeCell) {
        this.flags_count += 1;
        document.getElementById('flags_count').innerHTML = this.flags_count;
        activeCell.removeAttribute('flag');
        activeCell.classList.remove('flag');
    };
    this.returnStartParameters = function() {
        document.getElementById('flags_count').innerHTML = this.flags_count;
        this.mediator.getStartParameters(this, this.currentFieldSize, this.flags_count)
    };
};
prepeareToStart = function(level) {
    var gameParameters = new GameParameters(level, mediator);
    gameParameters.returnStartParameters()
};


function getCellsFieldList(field_size) {
    var coordinate_list = [];
    for (var row = 0; row < field_size; row++) {
        for (var column = 0; column < field_size; column++) {
            coordinate_list.push(row + '_' + column)
        }
    }
    return coordinate_list; //["0_0", "0_1",'1_0','0_2',...]
}
function randomMinesScattering(cellsFieldList, cellsNumber, flags_count) {
    var random_number, currentCell;
    var arrayOfIndexes = []; //for random numbers which will be indexes of
    var minedCellsObj = {}; //obj with all parameters of cell
    while (arrayOfIndexes.length < flags_count) {
        random_number = Math.round(Math.random() * (cellsNumber-1));
        if (!arrayOfIndexes.includes(random_number)) {
            arrayOfIndexes.push(random_number);
        }
    }
    for (var item = 0; item < cellsFieldList.length; item++) {
        currentCell = cellsFieldList[item];
        if (arrayOfIndexes.includes(item)) {
            minedCellsObj[currentCell] = {'mined': true }
        } else{
            minedCellsObj[currentCell] = {'mined': false }
        }

    }
    return minedCellsObj; // { "0_0":{'mined':false}, "0_1":{'mined': true}, ...}
}

function runCounterOfMinedNeighborsForCell(minedCellsObj, cellsFieldList, currentFieldSize) {
    cellsFieldList.forEach(function (cell) {
        var countOfMinedNeighbors, coordinates, x, y;
        if (!minedCellsObj[cell]['mined']) {
            countOfMinedNeighbors = 0;
            coordinates = cell.split("_");
            x = coordinates[0];
            y = coordinates[1];
            for (var i = x - 1; i <= +x + 1; i++) {
                for (var j = y - 1; j <= +y + 1; j++) {
                    if (i >= 0 && i < currentFieldSize && j >= 0 && j < currentFieldSize && !( i == x && j == y)) {
                        var currentNeighbor = i + "_" + j;
                        if (minedCellsObj[currentNeighbor]['mined'] === true) {
                            countOfMinedNeighbors += 1
                        }
                    }
                }
            }
            minedCellsObj[cell]['minedNeighbors'] = countOfMinedNeighbors
        } else {
            minedCellsObj[cell]['minedNeighbors'] = "*"
        }
    });
    return minedCellsObj
}
document.oncontextmenu = function(e) {
event.preventDefault();
  };

window.onload = function() {
    var settingBtns = document.getElementById('set-level');
    var closeDialog = document.getElementById('message');
    var result = document.getElementById('result');
    closeDialog.addEventListener('click', function() {
        this.classList.toggle('hidden');
    });
    settingBtns.addEventListener('click', function(e) {
        level = e.target.value;
        prepeareToStart(level);
    });
    result.addEventListener('click', function(e) {
        prepeareToStart(level);
    });
    //create field with default level
    if (!level){
        level = level_default;
        prepeareToStart(level);
    }
};




