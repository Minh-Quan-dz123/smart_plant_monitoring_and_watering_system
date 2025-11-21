package com.example.project_iot_auto_watering.ui.sensor

import android.annotation.SuppressLint
import android.content.Context
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.airbnb.lottie.animation.content.Content
import com.example.project_iot_auto_watering.R
import com.example.project_iot_auto_watering.data.model.response.DataEspAll
import com.example.project_iot_auto_watering.data.model.response.Garden
import com.example.project_iot_auto_watering.data.repository.GardenRepository
import com.example.project_iot_auto_watering.data.retrofit.RetrofitInstance
import com.example.project_iot_auto_watering.databinding.FragmentHomeContainerBinding
import com.example.project_iot_auto_watering.databinding.FragmentSensorBinding
import com.example.project_iot_auto_watering.ui.home.viewmodel.GardenVMFactory
import com.example.project_iot_auto_watering.ui.home.viewmodel.GardenViewModel
import com.example.project_iot_auto_watering.ui.sensor.adapter.AdapterDevice

class FragmentSensor : Fragment(), View.OnClickListener {
    private var _binding: FragmentSensorBinding? = null
    private val binding get() = _binding!!

    private lateinit var gardenViewModel: GardenViewModel
    private val gardenRepository = GardenRepository(RetrofitInstance.api)

    private lateinit var adapterDevice: AdapterDevice
    private lateinit var rcvDevice: RecyclerView

    private val listEsp: MutableList<DataEspAll> = mutableListOf()

    private var tokenAuth: String? = ""

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentSensorBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        tokenAuth = requireContext().getSharedPreferences("Auth", Context.MODE_PRIVATE)
            .getString("token", "")

        initViewModel()
        initObserve()
        initAdapter()
        initListener()
    }

    private fun initListener() {
        binding.iconBack.setOnClickListener(this)
    }

    private fun initViewModel() {
        gardenViewModel = ViewModelProvider(
            requireActivity(),
            GardenVMFactory(gardenRepository)
        )[GardenViewModel::class.java]

        gardenViewModel.getAllDataEsp(tokenAuth.toString()) {}

    }

    private fun initAdapter() {
        rcvDevice = binding.rcvSensor
        adapterDevice = AdapterDevice(listEsp)
        rcvDevice.layoutManager = LinearLayoutManager(requireContext())
        rcvDevice.adapter = adapterDevice
    }

    @SuppressLint("NotifyDataSetChanged")
    private fun initObserve() {
        gardenViewModel.listEspDevice.observe(viewLifecycleOwner) { list ->
            listEsp.clear()
            listEsp.addAll(list)
            adapterDevice.notifyDataSetChanged()
        }
    }

    override fun onClick(p0: View?) {
        when (p0?.id) {
            R.id.icon_back -> {
                Toast.makeText(requireContext(), "Click", Toast.LENGTH_SHORT).show()
            }
        }
    }
}