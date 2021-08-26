// Copyright (c) 2021, NVIDIA CORPORATION.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import 'bootstrap/dist/css/bootstrap.min.css';
import './style.css';

import { Container, Navbar, Nav } from 'react-bootstrap';
import { QueryDashboard } from '../components/querydashboard';
import React from 'react';

export default function App() {
  return (
    <div>
      <Navbar bg="dark" variant="dark">
        <Container>
          <Navbar.Brand className={"navbar"}>node-rapids │ Blazing Cluster Server Demo</Navbar.Brand>
          <Nav>
            <Nav.Link href="https://github.com/rapidsai/node">node-rapids github</Nav.Link>
          </Nav>
        </Container>
      </Navbar>
      <QueryDashboard />
    </div >
  )
}
