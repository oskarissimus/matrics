# Matrics

- 3d fps game like counter strike to play with friends over network

# functional requirements

- it should work in browser
- weapon model should be visible on the screen
- proper orientation of weapon model on the screen
- floor should be solid so player dont fall through it
- other players should be displayed

## movement

- pressing of w should cause player to move forward, s - backwards, a - left, d - right
- moving mouse up should rotate camera up moving left should rotate camera left moving ringht should rotate camera right and moveing down should rotate camera down

## gameplay

- hp bar should be displayed and the number of hp left
- after getting hit by a bullet hp should decrease
- other players should be displayed as cubes in different colors

## server

- sever should be started with npm start

## interface

- after opening game player immediately spawns in game with no lobby
- each new player gets next number suffix

## non-functional requirements

- dont create readme file
- server should be started with npm start
- no need to handle multiple games in single server
