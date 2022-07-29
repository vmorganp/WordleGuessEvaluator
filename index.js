async function stats() {
    // this object is going to be the heart and soul of this
    let data = {
        "answer": document.getElementById("solution").value.toLowerCase().trim(),
        "guesses": []
    }

    // get all of the inputs, do some preprocessing, stick them into that ^ data object 
    for (let i = 0; i < 6; i++) {
        g = document.getElementById("guess" + (i + 1)).value.toLowerCase().trim()
        if (g && g.length == 5) {
            data['guesses'].push({ [g]: {} })
        }
        else if (g && g.length != 5) {
            alert("one of your guesses is the wrong length")
        }
    }

    data = process(data)

    tmpGuessable = wordle_guessable
    tmpSolutions = wordle_solutions

    for (let i = 0; i < data['guesses'].length; i++) {
        const guess = data['guesses'][i][Object.keys(data['guesses'][i])];

        let prunedGuessable = await prune(guess, tmpGuessable)
        let prunedSolutions = await prune(guess, tmpSolutions)


        guess.remainingGuessableCount = prunedGuessable.length
        if (prunedGuessable.length < 50) {
            guess.remainingGuessable = prunedGuessable
        }

        guess.remainingSolutionsCount = prunedSolutions.length
        if (prunedSolutions.length < 50) {
            guess.remainingSolutions = prunedSolutions
        }
        tmpGuessable = prunedGuessable
        tmpSolutions = prunedSolutions
    }
    // at this point we're done making data, it's all just displaying it
    console.log(data)

    // clear existing output
    for (let i = 0; i < 6; i++) {
        x = document.getElementById("guess" + (i + 1) + "Stats")
        x.innerHTML = ""
    }

    // output current data
    for (let i = 0; i < data['guesses'].length; i++) {
        const guess = data['guesses'][i][Object.keys(data['guesses'][i])];
        table = `
        <table>
          <tr>
            <td># of Remaining Solutions</td>
            <td>${guess.remainingSolutionsCount}</td>
          </tr>
          <tr>
            <td># of Remaining Guessable Words</td>
            <td>${guess.remainingGuessableCount}</td>
          </tr>`
        if (guess.remainingSolutions) {
            table += `
            <tr>
              <td>Remaining Solutions</td>
              <td>${guess.remainingSolutions}</td>
            </tr>
            `
        }

        if (guess.remainingGuessable) {
            table += `
            <tr>
              <td>Remaining Solutions</td>
              <td>${guess.remainingGuessable}</td>
            </tr>
            `
        }
        table += "</table>"
        x = document.getElementById("guess" + (i + 1) + "Stats")
        x.innerHTML = table
    }
}

function prune(guess, wordlist) {
    for (const letter in guess) {
        if (Object.hasOwnProperty.call(guess, letter)) {
            const element = guess[letter];

            // black
            if (element.occurences == 0) {
                wordlist = wordlist.filter(function (str) {
                    if (!str.includes(letter)) {
                        return str
                    }
                })
            }

            // green/yellow
            else {
                wordlist = wordlist.filter(function (str) {
                    let occurences = element.occurences
                    // filter out words that don't have matching letter on green
                    for (let i = 0; i < element.positions.length; i++) {
                        const x = element.positions[i];
                        if (str[x] != letter) {
                            return false
                        }
                        else {
                            replace_used_char_in_get_colors(str, i)
                            occurences--;
                        }
                    }

                    // filter out words with letter in same position as yellow
                    for (let i = 0; i < element.nonPositions.length; i++) {
                        const x = element.nonPositions[i];
                        if (str[x] == letter) {
                            return false
                        }

                    }

                    // filter out words that are missing a yellow
                    if (occurences > 0) {
                        if ((str.split(letter).length - 1) < occurences) {
                            return false
                        }
                    }

                    // filter out words that have too many of a yellow
                    if (element.occurences > 0) {
                        if ((str.split(letter).length - 1) > element.occurences) {
                            return false
                        }
                    }

                    return true
                })
            }
        }
    }
    return wordlist
}


function process(data) {
    // iterate guesses
    for (let w = 0; w < data.guesses.length; w++) {
        answer = data.answer
        guess = Object.keys(data.guesses[w])[0]
        // initialize data for each letter
        for (let l = 0; l < 5; l++) {
            letter = guess[l]
            data.guesses[w][guess][letter] = { "occurences": 0, positions: [], nonPositions: [] }
        }

        // figure out the occurences and positions
        // green and black first, otherwise yellow acts weird
        for (let l = 0; l < 5; l++) {
            letter = guess[l]

            // green
            if (guess[l] == answer[l]) {
                data.guesses[w][Object.keys(data.guesses[w])[0]][letter].occurences++
                data.guesses[w][Object.keys(data.guesses[w])[0]][letter].positions.push(l)
                guess = replace_used_char_in_get_colors(guess, l)
                answer = replace_used_char_in_get_colors(answer, l)

            }
            // grey
            else if (!answer.includes(guess[l])) {
                guess = replace_used_char_in_get_colors(guess, l)
            }
        }

        // yellow
        for (let l = 0; l < 5; l++) {
            if (answer.includes(guess[l]) && guess[l] != " ") {
                data.guesses[w][Object.keys(data.guesses[w])[0]][guess[l]].occurences++
                data.guesses[w][Object.keys(data.guesses[w])[0]][guess[l]].nonPositions.push(l)
                guess = replace_used_char_in_get_colors(guess, l)
            }
        }
    }
    return data
}

// a poorly named helper for get_colors
function replace_used_char_in_get_colors(word, index) {
    return word.substring(0, index) + " " + word.substring(index + 1);
}


function print_colors(colors) {
    const colorMap = {
        "green": "&#129001;",
        "grey": "&#11035;",
        "yellow": "&#129000;",
    }
    colorString = "<p>"
    for (let i = 0; i < colors.length; i++) {
        const color = colors[i];
        colorString = colorString.concat(colorMap[color])
    }
    return colorString.concat("</p>")
}