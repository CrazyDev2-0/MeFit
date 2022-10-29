import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:optum_hackathon/domain/controller/globalController.dart';

class DeviceLinkProcess extends StatefulWidget {
  final String hardwareId;
  const DeviceLinkProcess({Key? key, required this.hardwareId}) : super(key: key);

  @override
  State<DeviceLinkProcess> createState() => _DeviceLinkProcessState();
}

class _DeviceLinkProcessState extends State<DeviceLinkProcess> {
  GlobalController _globalController = Get.find<GlobalController>();
  bool isLinking = true;
  bool isLinkSuccess = false;
  String message = "Linking Device...";

  @override
  void initState() {
    super.initState();
    linkDevice();
  }

  Future<void> linkDevice() async {
    setState(() {
      isLinking = true;
    });
    var response = await _globalController.linkDevice(widget.hardwareId);
    setState(() {
      isLinking = false;
      isLinkSuccess = response["success"];
      message = response["message"];
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        leading: IconButton(
            onPressed: (){
              Get.back();
            },
            icon: const Icon(Icons.arrow_back, color: Colors.white)
        ),
      ),
      body: Center(
        child: isLinking ? const CircularProgressIndicator(color: Colors.white)
            : Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                isLinkSuccess ? const Icon(Icons.done_outline_outlined, color: Colors.green, size: 100,)
                : const Icon(Icons.error_outline_outlined, color: Colors.red, size: 100,),
                const SizedBox(height: 20,),
                Text(message, style: const TextStyle(color: Colors.white, fontSize: 20),)
              ],
        )
      ),
    );
  }
}
