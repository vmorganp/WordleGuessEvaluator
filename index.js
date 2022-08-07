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
    console.log(data);

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
        <table class="table">
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
              <td>${guess.remainingSolutions.join(" ")}</td>
            </tr>
            `
        }

        if (guess.remainingGuessable) {
            table += `
            <tr>
              <td>Remaining Guessable</td>
              <td>${guess.remainingGuessable.join(" ")}</td>
            </tr>
            `
        }
        table += "</table>"
        x = document.getElementById("guess" + (i + 1) + "Stats")
        x.innerHTML = table
    }
}

function prune(guess, wordlist) {
    const debugWord = ""
    for (const letter in guess) {
        if (Object.hasOwnProperty.call(guess, letter)) {
            const element = guess[letter];

            // black
            if (element.max == 0) {
                wordlist = wordlist.filter(function (str) {
                    if (!str.includes(letter)) {
                        return str
                    }
                })
            }

            // green/yellow
            else {
                wordlist = wordlist.filter(function (str) {
                    if (str == debugWord) {
                        console.log(str);
                        console.log(element);
                    }
                    let occurences = element.max
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


                    if (str == debugWord) {
                        console.log(`Present after filtering green/yellow 1`)
                    }

                    // filter out words with letter in same position as yellow
                    for (let i = 0; i < element.nonPositions.length; i++) {
                        const x = element.nonPositions[i];
                        if (str[x] == letter) {
                            return false
                        }

                    }

                    if (str == debugWord) {
                        console.log(`Present after filtering green/yellow 2`)
                    }

                    // filter out words that are missing a yellow
                    if (occurences > 0) {
                        if ((str.split(letter).length - 1) < occurences) {
                            return false
                        }
                    }

                    if (str == debugWord) {
                        console.log(`Present after filtering green/yellow 3`)
                    }


                    if ((str.split(letter).length - 1) < element.min) {
                            return false
                        }


                    if (str == debugWord) {
                        console.log(`Present after filtering green/yellow 4`)
                    }

                    return true
                })
            }
        }
    }
    return wordlist
}


function process(data) {
    for (const g in data.guesses) {
        let answer = data.answer
        let guessStr = JSON.parse(JSON.stringify(Object.keys(data.guesses[g])[0]))
        const guessObj = data.guesses[g][guessStr];

        // initialize the data for each letter
        for (const l in guessStr) {
            const letterStr = guessStr[l]
            guessObj[letterStr] = {}
            guessObj[letterStr].min = 0
            guessObj[letterStr].max = null
            guessObj[letterStr].positions = []
            guessObj[letterStr].nonPositions = []
        }

        // green and black first, so we can sanitize data for yellow
        for (const l in guessStr) {
            let letterStr = guessStr[l]
            let letterObj = guessObj[letterStr]

            // green
            if (letterStr == answer[l]) {
                letterObj.min++
                letterObj.positions.push(l)
                guessStr = replace_used_char_in_get_colors(guessStr, l)
                answer = replace_used_char_in_get_colors(answer, l)
            }

            // grey
            else if (!answer.includes(letterStr)) {
                letterObj.max = 0
            }
        }

        // yellow
        for (const l in guessStr) {
            let letterStr = guessStr[l]
            if (letterStr == " ") continue
            let letterObj = guessObj[letterStr]
            if (answer.includes(guessStr[l]) && guessStr[l] != " ") {
                letterObj.min++
                letterObj.nonPositions.push(l)
                guessStr = replace_used_char_in_get_colors(guessStr, l)
                answer = answer.replace(letterStr, " ")
            }
            else {
                letterObj.max = letterObj.min
            }
        }
    }
    return data
}

// a poorly named helper for get_colors
function replace_used_char_in_get_colors(word, index) {
    // for fucks sake, why would the index of something be string by default
    // anyway, we fix that here
    index = parseInt(index)
    return [word.substring(0, index), word.substring(index + 1)].join(" ")
}
