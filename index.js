const express = require('express');
const socket = require('socket.io');
const {exec} = require('child_process');

const port = process.env.PORT || 5000;
const app = express();

const start_slam_service = "sudo systemctl start robot-slam.service"
const start_autonomy_service = "sudo systemctl start robot-autonomy.service"
const stop_slam_service = "sudo systemctl stop robot-slam.service"
const stop_autonomy_service = "sudo systemctl stop robot-autonomy.service"

app.use(express.static('public'));

app.get('/', (req, res) => {
   res.send("HTTPS WORKING!");
})

const server = app.listen(port, () => {
   console.log("====================================");
   console.log('\x1b[42m\x1b[30m%s\x1b[0m', `Listening on PORT ${port}...`);
   console.log("====================================");
});

const io = socket(server);

let robotID = null;

io.on('connect', (socket) => {
   console.log(`user ${socket.id} connected`);

   if (robotID)
   {
      io.emit('robot_status', true)
   }

   socket.on('robot_connect', (val) => {
      console.log("Robot Connected");
      robotID = socket.id;
      io.emit('robot_status', true)
      exec(start_slam_service, (error, stdout, stderr) => {
         if (error) {
            console.error(`error: ${error.message}`);
            return;
         }
         if (stderr) {
            console.error(`stderr: ${stderr}`);
            return;
         }
         console.log('SLAM service started.');

         exec(start_autonomy_service, (error, stdout, stderr) => {
            if (error) {
               console.error(`error: ${error.message}`);
               return;
            }
            if (stderr) {
               console.error(`stderr: ${stderr}`);
               return;
            }
            console.log('Autonomy service started.');
         })
      })
   })

   socket.on('humidities', (val) => {
      // console.log(val);
      io.emit('humidity_data', val)
   })

   socket.on('water_lvl_update', (val) => {
      // console.log(val);
      io.emit('water_lvl_data', val)
   })

   socket.on('disconnect',  () => {
      if(socket.id === robotID)
      {
         console.log("Robot Disconnected");
         robotID = null;
         io.emit('robot_status', false)
         exec(stop_slam_service, (error, stdout, stderr) => {
            if (error) {
               console.error(`error: ${error.message}`);
               return;
           }
           if (stderr) {
               console.error(`stderr: ${stderr}`);
               return;
           }
           console.log('SLAM service stopped.');

           exec(stop_autonomy_service, (error, stdout, stderr) => {
            if (error) {
               console.error(`error: ${error.message}`);
               return;
            }
            if (stderr) {
               console.error(`stderr: ${stderr}`);
               return;
            }
            console.log('Autonomy service stopped.');
         })
         })
      }
      else
      {
         console.log(`user ${socket.id} disconnected`);
      }
  });
})