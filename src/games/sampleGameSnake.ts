export const SAMPLE_GAME_CODE = `-- title:  Snake
-- author: AI Generator
-- desc:   Classic snake for TIC-80
-- script: lua

-- Initialize game variables at top level
s=8 gw=30 gh=17
snake={} dx=1 dy=0 tick=0 tmax=10 score=0 fx=10 fy=8 state=0 turned=false

function reset()
 snake={{x=math.floor(gw/2),y=math.floor(gh/2)},{x=math.floor(gw/2)-1,y=math.floor(gh/2)}}
 dx,dy=1,0 score=0 tick=0 tmax=10 turned=false
 place_food()
 state=1
end

function place_food()
 repeat
  fx=math.random(1,gw-2)
  fy=math.random(1,gh-2)
  coll=false
  for i=1,#snake do if snake[i].x==fx and snake[i].y==fy then coll=true break end end
 until not coll
end

function draw_board()
 cls(0)
 -- walls
 rect(0,0,240,s,11)
 rect(0,0,s,136,11)
 rect(240-s,0,s,136,11)
 rect(0,136-s,240,s,11)
 -- score
 print("SCORE:"..score,2,2,0)
end

function draw_snake()
 for i=1,#snake do
  local c=i==1 and 12 or 10
  rect(snake[i].x*s, snake[i].y*s, s, s, c)
 end
 rect(fx*s, fy*s, s, s, 2)
end

function step()
 local nx=snake[1].x+dx
 local ny=snake[1].y+dy
 -- wall
 if nx<1 or nx>gw-2 or ny<1 or ny>gh-2 then state=2 return end
 -- self
 for i=2,#snake do if snake[i].x==nx and snake[i].y==ny then state=2 return end end
 table.insert(snake,1,{x=nx,y=ny})
 if nx==fx and ny==fy then
  score=score+1
  tmax=math.max(3,10-math.floor(score/3))
  place_food()
 else
  table.remove(snake)
 end
 turned=false
end

function handle_input()
 if not turned then
  if btn(0) and dy==0 then dx,dy=0,-1 turned=true end
  if btn(1) and dy==0 then dx,dy=0,1 turned=true end
  if btn(2) and dx==0 then dx,dy=-1,0 turned=true end
  if btn(3) and dx==0 then dx,dy=1,0 turned=true end
 end
end

function TIC()
 if state==0 then
  cls(0)
  print("S N A K E",84,40,12)
  print("ARROWS TO MOVE",70,60,6)
  print("PRESS Z TO START",65,80,7)
  if btn(4) then math.randomseed(time()) reset() end
  return
 end
 handle_input()
 tick=tick+1
 if tick%tmax==0 then step() end
 draw_board()
 draw_snake()
 if state==2 then
  print("GAME OVER",90,54,14)
  print("SCORE: "..score,96,66,15)
  print("Z - RESTART",90,80,7)
  if btn(4) then math.randomseed(time()) reset() end
 end
end
`;
