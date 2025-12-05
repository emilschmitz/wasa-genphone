export const SAMPLE_GAME_CODE = `-- title:  Snake
-- author: WASA Phone
-- desc:   Classic snake game
-- script: lua

-- Snake game variables
snake = {{x=120, y=68}}
dir = {x=1, y=0}
food = {x=0, y=0}
score = 0
gameOver = false
moveTimer = 0
moveDelay = 8

function spawnFood()
    food.x = math.random(1, 29) * 8
    food.y = math.random(1, 16) * 8
end

spawnFood()

function TIC()
    if gameOver then
        cls(0)
        print("GAME OVER", 88, 60, 12)
        print("Score: "..score, 92, 75, 14)
        print("Press Z to restart", 68, 90, 6)
        if btn(4) then
            snake = {{x=120, y=68}}
            dir = {x=1, y=0}
            score = 0
            gameOver = false
            spawnFood()
        end
        return
    end

    -- Input
    if btn(0) and dir.y ~= 1 then dir = {x=0, y=-1} end
    if btn(1) and dir.y ~= -1 then dir = {x=0, y=1} end
    if btn(2) and dir.x ~= 1 then dir = {x=-1, y=0} end
    if btn(3) and dir.x ~= -1 then dir = {x=1, y=0} end

    -- Move timer
    moveTimer = moveTimer + 1
    if moveTimer >= moveDelay then
        moveTimer = 0

        -- Move snake
        local newHead = {x = snake[1].x + dir.x * 8, y = snake[1].y + dir.y * 8}

        -- Wall collision
        if newHead.x < 0 or newHead.x >= 240 or newHead.y < 0 or newHead.y >= 136 then
            gameOver = true
            return
        end

        -- Self collision
        for i, seg in ipairs(snake) do
            if newHead.x == seg.x and newHead.y == seg.y then
                gameOver = true
                return
            end
        end

        table.insert(snake, 1, newHead)

        -- Food collision
        if newHead.x == food.x and newHead.y == food.y then
            score = score + 10
            spawnFood()
        else
            table.remove(snake)
        end
    end

    -- Draw
    cls(0)
    
    -- Draw food
    rect(food.x, food.y, 8, 8, 6)

    -- Draw snake
    for i, seg in ipairs(snake) do
        if i == 1 then
            rect(seg.x, seg.y, 8, 8, 11)
        else
            rect(seg.x, seg.y, 8, 8, 3)
        end
    end

    -- Draw score
    print("Score: "..score, 2, 2, 12)
end
`;
