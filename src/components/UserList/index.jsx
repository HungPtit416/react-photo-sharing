import React, { useState, useEffect } from "react";
import {
  Divider,
  List,
  ListItem,
  ListItemText,
  Typography,
  Box,
} from "@mui/material";
import { Link } from "react-router-dom";
import "./styles.css";
import fetchModel from "../../lib/fetchModelData";

/**
 * Define UserList, a React component of Project 4.
 */
function UserList({ onlineUserIds = [] }) {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchModel("/user/list")
      .then((data) => {
        setUsers(data);
      })
      .catch((err) => {
        console.error("Error fetching users:", err);
      });
  }, []);

  // Check if a user is online
  const isUserOnline = (userId) => {
    return onlineUserIds.includes(userId);
  };

  return (
    <div className="user-list">
      <Typography variant="h5" component="h1">
        Users
      </Typography>
      <List component="nav">
        {users.map((user) => (
          <React.Fragment key={user._id}>
            <ListItem
              button
              component={Link}
              to={`/users/${user._id}`}
              className="user-list-item"
            >
              <Box
                sx={{ display: "flex", alignItems: "center", width: "100%" }}
              >
                {/* Green dot for online users */}
                {isUserOnline(user._id) && (
                  <span className="online-indicator"></span>
                )}
                <ListItemText
                  primary={`${user.first_name || ""} ${user.last_name || ""}`}
                  sx={{ ml: isUserOnline(user._id) ? 1 : 0 }}
                />
              </Box>
            </ListItem>
            <Divider />
          </React.Fragment>
        ))}
      </List>
    </div>
  );
}

export default UserList;
